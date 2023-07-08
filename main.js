
const APP_ID = "7431e3d68f8840a5a64e518def368477"
const TOKEN = "007eJxTYNjVLGj12l2eY+J5qfRbekKR9ppd5qUXV7xtzd35a+LJKSwKDOYmxoapxilmFmkWFiYGiaaJZiappoYWKalpxmYWJubm3XdXpjQEMjLMPtDPysjAyMACxCA+E5hkBpMsYJKdIbe0uCQxLZGBAQCfyCLg"
const CHANNEL = "mustafa"
let userID='';
import {
  PoseLandmarker,
  FilesetResolver ,
  HandLandmarker,
  DrawingUtils
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
// select model
let selectedModel = 0;
document
  .querySelectorAll('input[name="switch-model"]')[0]
  .addEventListener("change", () => {
    selectedModel=0
    console.log(
      document.querySelector('input[name="switch-model"]:checked').value
    );
  });
document
  .querySelectorAll('input[name="switch-model"]')[1]
  .addEventListener("change", () => {
    selectedModel=1
    console.log(
      document.querySelector('input[name="switch-model"]:checked').value
    );
  });
document
  .querySelectorAll('input[name="switch-model"]')[2]
  .addEventListener("change", () => {
    selectedModel=2
    console.log(
      document.querySelector('input[name="switch-model"]:checked').value
    );
  });

const LetterList = [
"ع",
"ال",
"ا",
"ب",
"د",
"ظ",
"ض",
"ف",
"ق",
"غ",
"ه",
"ح",
"ج",
"ك",
"خ",
"لا",
"ل",
"م",
"nothing",
"ن",
"ر",
"ص",
"س",
"ش",
"ت",
"ط",
"ث",
"ذ",
"ة",
"و",
"ي",
"ئ",
"ز",
];
const NumList=['0','1','2','3','4','5','6','7','8','9']
const poseList= [" ما اسمك"," اين منزلك"," السلام عليكم"," تمام الحمدلله"," عامل ايه",' انا تعبان'," محتاج مساعدة ؟", " عندك كم سنة", " رقم تليفونك", " انا من مصر"]
let classesNames=[];
let videos=[];
let word="";
let Camletter = [];
let counter = 0;
let prediction = undefined;
let videosParent=[];
let enableprediction=false;
let poseLandmarker = undefined;
let handLandmarker = undefined;
let poseModel = undefined;
let handModel = undefined;
let NumhandModel = undefined;
let sequence = []
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://fastly.jsdelivr.net/npm/@mediapipe/tasks-vision@0.1.0-alpha-11/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task`,
    },
    runningMode: 'VIDEO',
    numHands: 2,  
  });
  handModel = await tf.loadLayersModel(
    "https://raw.githubusercontent.com/Mustafa-Esmaail/arabic-sign-language/sign-lang-model-v1/model.json"
  );
 
  
  NumhandModel = await tf.loadLayersModel(
    "https://raw.githubusercontent.com/Mustafa-Esmaail/arabic-sign-language/sign-lang-model-v1/tfjs_num/model.json  "
  );

   poseModel = await tf.loadLayersModel(
    "https://raw.githubusercontent.com/Mustafa-Esmaail/arabic-sign-language/sign-lang-model-v1/tfjs_model/Lmodel.json"
  );
 
};
createHandLandmarker();
const createPoseLandmarker = async () => {
  const visionPose = await FilesetResolver.forVisionTasks(
    "https://fastly.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(visionPose, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task`,
    },
    runningMode: 'VIDEO',
  });
};
createPoseLandmarker();
const calc_landmark_list=(landmarks,videoHeight,videoWidth)=>{
  let landmark_point = [];

  landmarks.map((landmark) => {

    const landmark_x = Math.min(
      Number(landmark.x * videoWidth),
      videoWidth - 1
    );
    const landmark_y = Math.min(
      Number(landmark.y * videoHeight),
      videoHeight - 1
    );
    landmark_point.push([landmark_x, landmark_y]);
  });
  return landmark_point;

}  
const process_landmark_ponts=(landmark_points)=>{
  var base_x = 0;
  var base_y = 0;
  let marks = [];

  landmark_points.map((point, index) => {
    if (index === 0) {
      base_x = landmark_points[index][0];

      base_y = landmark_points[index][1];
    }
    landmark_points[index][0] = landmark_points[index][0] - base_x;
    landmark_points[index][1] = landmark_points[index][1] - base_y;
    marks.push(landmark_points[index][0]);
    marks.push(landmark_points[index][1]);
  });

  let max_value = Math.max.apply(null, marks.map(Math.abs));

  marks.map((point, idx) => {
    marks[idx] = marks[idx] / max_value;
  });
  let tfMark = tf.tensor(marks).reshape([1, 42]);


  return tfMark;

}
let lastVideoTime = -1;

const predict =async ()=>{
  // enableprediction=true
  // console.log(videos)
  for(let i =0;i< videos.length;i++){
    // Camletter[i]=0;
    console.log(Camletter[i])

      const videoWidth =videos[i].videoWidth;
      const videoHeight =videos[i].videoHeight;
      console.log(videoWidth);
      console.log(videos[i])
      let startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(videos[i], startTimeMs);
      console.log(results)
      const canvas=  videosParent[i].childNodes[1];
      const h4result=  videosParent[i].childNodes[2];
      const cxt = canvas.getContext("2d");
      if(selectedModel==2){
        // words
        if(results.handednesses.length >0){
        let keypoints=[]
        if (lastVideoTime !== videos[i].currentTime) {
          lastVideoTime = videos[i].currentTime;
          poseLandmarker.detectForVideo(videos[i], startTimeMs, (result) => {
            cxt.save();
            cxt.clearRect(0, 0, canvas.width, canvas.height);
            const drawingUtils = new DrawingUtils(cxt);
    
            for (const landmark of result.landmarks) {
              drawingUtils.drawLandmarks(landmark);
              drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            }
            for (const landmarks of results.landmarks) {
              drawConnectors(cxt, landmarks, HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 5,
              });
              drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
          }
          });
          // hand 
         
     
    cxt.restore();
      let pose=[];
      let hands=[];
      poseLandmarker.result.landmarks.map((poseLandmark)=>{
        console.log(poseLandmark)
        poseLandmark.map((point)=>{
          pose.push(point.x)
          pose.push(point.y)
          pose.push(point.z)
          
        })
      })
      console.log(results.handednesses.length  )
      if(results.handednesses.length >1 ){
        results.landmarks.map((landmarks) => {
        
          landmarks.map((point)=>{
            hands.push(point.x)
            hands.push(point.y)
            hands.push(point.z)
          })
        })
      }
      else{
        if(results.handednesses[0][0].categoryName =='Left'){
      // console.log(results.results.handednesses.categoryName )

          results.landmarks.map((landmarks) => {
        
            const array = new Array(21*3).fill(0);
            console.log(array)
    
            landmarks.map((point)=>{
              hands.push(point.x)
              hands.push(point.y)
              hands.push(point.z)
            })
            hands = hands.concat(array)
          })
        }
        else{
          results.landmarks.map((landmarks) => {
        
            const array = new Array(21*3).fill(0);
            console.log(array)
            hands = hands.concat(array)
            landmarks.map((point)=>{
              hands.push(point.x)
              hands.push(point.y)
              hands.push(point.z)
            })
           
          })
        }
      }
      keypoints=pose.concat(hands)
      console.log(keypoints.length)
      console.log(sequence[0])
    
      sequence[i].push(keypoints)
      console.log(sequence)
      // console.log(pose.length)
      if (sequence[i].length ==40){
        let tfpose=tf.tensor(sequence[i]);
        tfpose=  tfpose.expandDims(0)
        // let tfMark = tf.tensor(marks).reshape([1, 42]);
        const pred = poseModel.predict(tfpose);
        const PoseResult = pred.dataSync();
        const arr = Array.from(PoseResult);
        const maxPredict = Math.max.apply(null, arr);
        const idx = arr.indexOf(maxPredict);
        console.log(maxPredict)
        console.log(idx)
        Camletter[i].push(poseList[idx]);

        word = Camletter[i].join("");
        h4result.innerHTML=word
        
        sequence[i]=[]
      }
    
      // console.log(hands)

      







    }
  }
  }
     
      else{
        //letter

      
    
      let letter=''
      console.log(results.landmarks)
      if(results.landmarks.length >0){
      counter = 0;
        results.landmarks.map((landmarks) => {
          let landmark_list= calc_landmark_list(landmarks,videoHeight,videoWidth);
          console.log(landmark_list);
          let tfLand= process_landmark_ponts(landmark_list);
          console.log(tfLand)
          if(selectedModel==0){
            prediction = handModel.predict(tfLand);
            classesNames=LetterList;
            const handResult = prediction.dataSync();
            const arr = Array.from(handResult);
            const maxPredict = Math.max.apply(null, arr);
            const idx = arr.indexOf(maxPredict);
            console.log(classesNames[idx]);
            word= word.concat(classesNames[idx])
            console.log(word)
            Camletter[i].push(classesNames[idx]);
            word = Camletter[i].join("");
            h4result.innerHTML=word
            // console.log(classesNames[idx]);
            // word= word.concat(classesNames[idx])

            // console.log(Camletter[i])
            // if(Camletter[i]){
            //   Camletter[i].push(classesNames[idx]);
            //   word = Camletter[i].join("");
            // }
            // else{
            //   Camletter[i] = classesNames[idx];
            // }
            
            
            h4result.innerHTML=word
         }
         else if(selectedModel==1){
            prediction = NumhandModel.predict(tfLand);
            classesNames=NumList;
            const handResult = prediction.dataSync();
            const arr = Array.from(handResult);
            const maxPredict = Math.max.apply(null, arr);
            const idx = arr.indexOf(maxPredict);
            console.log(classesNames[idx]);
            word= word.concat(classesNames[idx])
            console.log(word)
            Camletter[i].push(classesNames[idx]);
            word = Camletter[i].join("");
            h4result.innerHTML=word
            // console.log(classesNames[idx]);
            // word= word.concat(classesNames[idx])
            // console.log(Camletter[i])
            // if(Camletter[i]){
            //   Camletter[i].push(classesNames[idx]);
            //   word = Camletter[i].join("");
            // }
            // else{
            //   Camletter[i] = classesNames[idx];
            // }
            
            
            h4result.innerHTML=word
         }

          
         
          // Camletter.push(classesNames[idx]);
          
 

        });
        cxt.save();
      cxt.clearRect(0, 0, canvas.width, canvas.height);
      for (const landmarks of results.landmarks) {
          drawConnectors(cxt, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5,
          });
          drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
      }
    cxt.restore();
 
      }
      else{
        counter++;
        if(counter ==3 ){
          console.log(counter)
          Camletter[i].push(' ')
          // word = word.concat(' ')
          // console.log(word)
          // // word.concat(' ')
          counter=0;
        }
      }
    }
      

     

  }
 


 if(selectedModel==2){
  setTimeout(() => {
    if(enableprediction==true){
        predict();

    }
  },1);
 }
 else{
  setTimeout(() => {
    if(enableprediction==true){
        predict();
        // console.log(counter)

    }
  }, 1000);
 }
  // let startTimeMs = performance.now();
  // const results = handLandmarker.detectForVideo(video, startTimeMs);
  // console.log(results)

}



const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {

  client.on('user-published', handleUserJoined)
  
  client.on('user-left', handleUserLeft)
  
  let UID = await client.join(APP_ID, CHANNEL, TOKEN, null)
  userID=UID

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() 

  let player = `<div class="video-container" id="user-container-${UID}">
                      <div class="video-player" id="user-${UID}"></div>
                </div>`
  document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

  localTracks[1].play(`user-${UID}`)
  
  await client.publish([localTracks[0], localTracks[1]])
}

let joinStream = async () => {
  await joinAndDisplayLocalStream()
  document.getElementById('join-btn').style.display = 'none'
  document.getElementById('stream-controls').style.display = 'flex'
  videos=document.getElementsByClassName('agora_video_player')
  videosParent=document.getElementsByClassName('video-parent')
  Camletter.push([])
      sequence.push([])
      
      console.log(Camletter)
      console.log(sequence)
   for(let i =0;i<=videosParent.length;i++){
      const canvas = document.createElement("canvas");
      const h4 = document.createElement("h4");
      h4.setAttribute("class", "cam-result");
      canvas.setAttribute("class", "canvas");
      
      canvas.setAttribute("width", videosParent[i].getBoundingClientRect().width + "px");
      canvas.setAttribute("height", videosParent[i].getBoundingClientRect().height + "px");
      canvas.style =
          "left: 0px;" +
          "top: 0px;" +
          "width: " +
          videosParent[i].getBoundingClientRect().width +
          "px;" +
          "height: " +
          videosParent[i].getBoundingClientRect().height +
          "px;";
          videosParent[i].appendChild(canvas);
          videosParent[i].appendChild(h4);
          // console.log(videosParent[i].getBoundingClientRect().height)
   }
      
  // console.log(video)
}

let handleUserJoined = async (user, mediaType) => {

  remoteUsers[user.uid] = user 
  await client.subscribe(user, mediaType)

  if (mediaType === 'video'){
      let player = document.getElementById(`user-container-${user.uid}`)
      if (player != null){
          player.remove()
      }

      player = `<div class="video-container" id="user-container-${user.uid}">
                      <div class="video-player" id="user-${user.uid}"></div> 
               </div>`
      document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

      user.videoTrack.play(`user-${user.uid}`)
  }

  if (mediaType === 'audio'){
      user.audioTrack.play()
  }
  Camletter.push([])
  sequence.push([])
  
  console.log(Camletter)
  console.log(sequence)
  let videosParentlast=document.querySelectorAll(".video-parent")
  for(let i =0;i<=videosParentlast.length;i++){
  
      if (videosParentlast[i].childNodes.length > 1) { // Or just `if (element.childNodes.length)`
          // It has at least one
          console.log(videosParentlast[i].childNodes[1])
          videosParentlast[i].childNodes[1].style="width: " +
          videosParent[i].getBoundingClientRect().width +
          "px;" +
          "height: " +
          videosParent[i].getBoundingClientRect().height +
          "px;";
          videosParentlast[i].childNodes[1].setAttribute("width", videosParent[i].getBoundingClientRect().width + "px");
          videosParentlast[i].childNodes[1].setAttribute("height", videosParent[i].getBoundingClientRect().height + "px");
      }
      else{
          const canvas = document.createElement("canvas");
          const h4 = document.createElement("h4");
          h4.setAttribute("class", "cam-result");
          canvas.setAttribute("class", "canvas");
          canvas.setAttribute("width", videosParent[i].getBoundingClientRect().width + "px");
          canvas.setAttribute("height", videosParent[i].getBoundingClientRect().height + "px");
          canvas.style =
              "left: 0px;" +
              "top: 0px;" +
              "width: " +
              videosParent[i].getBoundingClientRect().width +
              "px;" +
              "height: " +
              videosParent[i].getBoundingClientRect().height +
              "px;";
              videosParent[i].appendChild(canvas);
              videosParent[i].appendChild(h4);

                      // console.log(videosParent[i].getBoundingClientRect().height)
      }
     
   }

}

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid]
  document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
  for(let i = 0; localTracks.length > i; i++){
      localTracks[i].stop()
      localTracks[i].close()
  }

  await client.leave()
  document.getElementById('join-btn').style.display = 'block'
  document.getElementById('stream-controls').style.display = 'none'
  document.getElementById('video-streams').innerHTML = ''
}

let toggleMic = async (e) => {
  if (localTracks[0].muted){
      await localTracks[0].setMuted(false)
      e.target.innerText = 'Mic on'
      e.target.style.backgroundColor = 'cadetblue'
  }else{
      await localTracks[0].setMuted(true)
      e.target.innerText = 'Mic off'
      e.target.style.backgroundColor = '#EE4B2B'
  }
}

let toggleCamera = async (e) => {
  console.log(userID)
  if(localTracks[1].muted){
      await localTracks[1].setMuted(false)
      e.target.innerText = 'Camera on'
      e.target.style.backgroundColor = 'cadetblue'
  }else{
      await localTracks[1].setMuted(true)
      e.target.innerText = 'Camera off'
      e.target.style.backgroundColor = '#EE4B2B'
  }
}
let togglePredict= async (e) => {
  
  if(enableprediction==true){
      let h4Results=document.getElementsByClassName('cam-result')
      console.log(h4Results)
      for(let i=0;i < h4Results.length ; i++){
        console.log(h4Results[i])
      h4Results[i].innerHTML=""
      }
      // word=""
      enableprediction=false;
      e.target.innerText = 'Start Detection'

  }else{
      enableprediction=true
      predict()
      e.target.innerText = 'Stop Detection'
      // // e.target.style.backgroundColor = '#EE4B2B'
  }
  console.log(enableprediction)
}

document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
// document.getElementById('detect-start').addEventListener('click', predict)
document.getElementById('detect-stop').addEventListener('click', togglePredict)
