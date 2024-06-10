function getActivityName(User) {
    let activityName;
    let customStatusName;
    try {
      let activities = User.presence.activities;
      if (activities && activities.length) {
        activities.forEach((activity) => {
          console.log("********** activity ",activity.name," ",activity.state," ",activity.type)
          switch (activity.type) {
            case 0: //'Hang Status'
              activityName = {"name": '\u{1F3AE}' +activity.name,
                "type":activity.type
              };
              break;
            case 4: //status
              customStatusName = {"name": '\u{1F4AC}'+ activity.state,//U+1F4AC
                "type":activity.type
              };
              break;
            case 6: //'Hang Status'
              break;
          }
        });
      }
    } catch (e) {}
    activityName = activityName ? activityName : customStatusName; //if name or status
    activityName = activityName ? activityName : {"name": '\u{1F464}'+User.user.globalName,"type":6}; //else username
  
    return activityName;
  }

  function whatName(currentActivityName,newActivityName){
    if(currentActivityName.name == newActivityName.name){
        return false
    }
    if(newActivityName.type==0 || currentActivityName.type!=0){
        return true
    }else{
        return false
    }
        
  }


  module.exports = {getActivityName ,whatName};