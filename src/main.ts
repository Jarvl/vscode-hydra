import {
  desktopCapturer
} from 'electron'
import * as vscode from 'vscode'

//import Audio from './audio'
import Hydra from 'hydra-synth'
import OscLoader from './osc-loader'
//import SourceClips from './source-clips'
import * as loop from 'raf-loop'
import P5 from './p5'
// import 'p5/lib/addons/p5.sound'

const PORT = 57101

declare global {
  interface Window {
    P5: typeof P5
    log: (msg: any, _class: any) => void
    msg: OscLoader
  }
}

interface Canvas extends Element {
  width: number
  height: number
}
// declare interface TextEditor {

// }

export default class Main {

  hydra: any = null
  osc: OscLoader | null = null
  audio: any = null
  // Create a hidden output channel
  outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('hydra >>')
  element: Element | null = null
  canvas: Canvas | null = null

  constructor() {
    // Make sure it's hidden - this may not be necessary
    this.outputChannel.hide()
    window.P5 = P5
    window.log = this.log.bind(this)
  }

  _eval(code: any) {

    let success = true
    try {
      eval(code)
    } catch (e) {
      success = false
      console.log(e, e.name, e.lineNumber, e.columnNumber, e.stack)
      this.log(e.message)
    }
    if (success) {
      this.log(code)
    }
  }

  log(msg: string) {
    this.outputChannel.clear()
    this.outputChannel.appendLine(msg)
  }

  evalBlock() {
    let editor
    if (editor = vscode.window.activeTextEditor) {
      let range = this.getCurrentParagraphIncludingComments(editor)
      // this.evalFlash(range)
      let expression = editor.document.getText(range)
      this._eval(expression)
    }
  }

  // TODO: need to use typeof TextEditor somehow
  getCurrentParagraphIncludingComments(editor: any) {
    let activePosition = editor.selection.active
    let startRow = activePosition.line
    let endRow = activePosition.line
    let lineCount = editor.document.lineCount

    // lines must include non-whitespace characters
    // and not be outside editor bounds
    while (/\S/.test(editor.lineAt(startRow).text) && startRow >= 0) {
      startRow--
    }
    while (/\S/.test(editor.lineAt(endRow).text) && endRow < lineCount) {
      endRow++
    }
    return new vscode.Range(new vscode.Position(startRow+1, 0), new vscode.Position(endRow, 0))
  }

  // evalFlash(range: vscode.Range) {
  //   console.log('evalFlash', range)
  //   let editor
  //   //  console.log("eval", vscode.window.activeTextEditor)
  //   if (editor = vscode.window.activeTextEditor) {
  //     //  var editor = this.getEditor()
  //     var marker = editor.markBufferRange(range, {
  //       invalidate: 'touch'
  //     })

  //     var decoration = editor.decorateMarker(
  //       marker, {
  //         type: 'line',
  //         class: 'hydra-flash'
  //       })

  //     setTimeout(() => {
  //       marker.destroy()
  //     }, 200)

  //   }
  // }

  evalLine() {
    let editor

    if (editor = vscode.window.activeTextEditor) {
      let range
      let text

      // Evaluate line if selection is empty
      if (editor.selection.isEmpty) {
        let line = editor.document.lineAt(editor.selection.active.line)
        text = line.text
        range = line.range
      }
      // Evaluate selection if not empty
      else {
        // Get selected text
        text = editor.document.getText(editor.selection)
        range = editor.selection
      }
      this._eval(text)
      // this.evalFlash(range)
    }
  }

  start() {
    //this.clips = new SourceClips()
    this.outputChannel.show(true)
    //  if (editor = atom.workspace.activeTextEditor()) {
    // atom.workspace.element.oncontextmenu = function (event) {
    //   if (event.preventDefault != undefined) event.preventDefault()
    //   if (event.stopPropagation != undefined) event.stopPropagation()
    // }
    //  }

    // const editor = vscode.window.activeTextEditor
    this.element = document.createElement('div')
    this.element.classList.add('hydra')
    this.canvas = document.createElement('canvas')
    // TODO: can this be dynamic?
    this.canvas.width = 1280
    this.canvas.height = 720

    document.body.classList.add('hydra-enabled')
    this.element.appendChild(this.canvas)
    //this.element.appendChild(this.audioCanvas)
    console.log('Hydra was toggled!')
    document.body.appendChild(this.element)

    this.hydra = new Hydra({
      canvas: this.canvas,
      autoLoop: false
    })

    // hijack source init screen event because doesn't work in Electron
    this.hydra.s.forEach((source: any) => {
      source.initScreen = (index: number) => desktopCapturer.getSources({
        types: ['window', 'screen']
      }, (error, sources) => {
        if (error) {
          throw error
        }
        // this.log(sources)
        if (sources.length > index) {
          navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
            // video: {
            //   mandatory: {
            //     chromeMediaSource: 'desktop',
            //     chromeMediaSourceId: sources[index].id,
            //     //  minWidth: 1280,
            //     maxWidth: 1280,
            //     //    minHeight: 720,
            //     maxHeight: 720
            //   }
            // }
          }).then((stream: any) => {
            const video = document.createElement('video')
            video.src = window.URL.createObjectURL(stream)
            video.addEventListener('loadedmetadata', () => {
              video.play().then(() => {
                source.src = video
                source.tex = source.regl.texture(source.src)
              })
            })
          })
        }
      })
    })

    const oscLoader = new OscLoader(PORT)
    this.osc = oscLoader
    window.msg = this.osc
    // oscLoader.on('message', this.onOsc)

    var self = this
    var engine = loop(function (dt: any) {
      // delta time in milliseconds
      self.hydra.tick(dt)
      //    self.audio.tick()
    }).start()
  }
  // osc().out()

  // onOsc(msg) {
  //   //  console.log("OSC", msg)

  // }

  stop() {
    //  this.isActive = false
    this.hydra.regl.destroy()
    document.body.classList.remove('hydra-enabled')
    document.body.removeChild(<Node>this.element)
    this.osc.destroy()
    this.outputChannel.hide()
    // if (this.osc) {
    //       this.osc.destroy()
    //   }
  }

}