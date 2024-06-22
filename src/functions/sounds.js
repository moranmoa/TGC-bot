async function selectSound(flag) {

  if(flag=="all"){
    let random = Math.floor(Math.random() * 9);
    let value= "Treasure-Goblin.opus"
    switch(random){
        case 0:
            value= "emotional damage.opus"
        break
        case 1:
        value= "Treasure-Goblin.opus"
        break
        case 2:
        value= "gay-echo.opus"//"goblin pack.opus"
        break
        case 3:
        value= "Golden Legendary.opus"
        break
        case 4:
        value= "work complete.opus"
        break
        case 5:
        value= "work work.opus"
        break
        case 6:
            value= "Zoltan.opus"
        break
        case 7:
            value= "PornHub.opus"
        break
        case 8:
            value= "gay-echo.opus"
        break
        // case 9:
        //     value= 
        // break
    }
    return value
  }
    
}

module.exports = { selectSound };
