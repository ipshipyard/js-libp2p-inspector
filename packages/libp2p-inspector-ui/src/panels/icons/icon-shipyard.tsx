import 'react'
import './icon.css'
import { GenIcon } from 'react-icons'

// generated from https://react-icons-json-generator.surge.sh/
const icon = {
  "tag":"svg",
  "attr":{
    "version":"1.1","x":"0","y":"0","viewBox":"0, 0, 16, 16"
  },
  "child":[{
    "tag":"path",
    "attr":{
      "d":"M10.668,0 L10.664,10.646 L16,5.323 L16,0 z"
    },
    "child":[]
  },{
    "tag":"path",
    "attr":{
      "d":"M15.973,10.677 L5.309,10.673 L10.641,16 L15.973,16 z"
    },
    "child":[]
  },{
    "tag":"path",
    "attr":{
      "d":"M5.332,16 L5.336,5.354 L0,10.677 L0,16 z"
    },
    "child":[]
  },{
    "tag":"path",
    "attr":{
      "d":"M0.027,5.323 L10.691,5.327 L5.359,0 L0.027,0 z"
    },"child":[]
  }]
}

export function ShipyardIcon (props: any) {
  return GenIcon(icon)(props)
}
