import * as p5lib from 'p5'

interface Canvas extends Element {
  style: {
    position: string
    top: string
    left: string
    zIndex: number
  }
}

export default class P5 extends p5lib{
  width: number
  height: number
  mode: string
  canvas: Canvas

  constructor ({
    width = window.innerWidth,
    height = window.innerHeight,
    mode = 'P2D'
  } = {}) {

    super(( p ) => {
      p.setup = () => { p.createCanvas(width, height, p[mode]) }
      p.draw = () => { }
    })
    this.width = width
    this.height = height
    this.mode = mode
    this.canvas.style.position = "absolute"
    this.canvas.style.top = "0px"
    this.canvas.style.left = "0px"
    this.canvas.style.zIndex = -1
    console.log('p5', this)
  //  return this.p5
  }

  show() {
    this.canvas.style.zIndex = -1
  }

  hide() {
    this.canvas.style.zIndex = -10
  }


}