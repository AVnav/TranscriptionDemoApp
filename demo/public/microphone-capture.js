let websocketSendUrl,
  websocketReceiveUrl,
  stompClient,
  jwtToken,
  semiRtSessionid,
  pollInterval,
  websocket,
  uuid;

// Add 3...2...1...GO countdown here and call function only after that..nested timeouts
//Checks every 500ms after start-capture button is clicked, and when captcha is filled...the session is called
document
  .getElementById("start-capture-button")
  .addEventListener("click", (e) => {
    setTimeout(function runThree() {
      const captcha = document.querySelector("#g-recaptcha-response").value;
      if (captcha.length < 3) {
        //console.log("Third connect websocket caller Timeout Reset");
        setTimeout(runThree, 500);
      } else {
        document.getElementById("containerOne").style.opacity = "1";
        document.getElementById("containerOne").style.display = "none";
        document.getElementById("checkboxContainer").style.display = "none";
        document.getElementById("containerTwo").style.display = "none";
        document.getElementById("containerThree").style.display = "flex";
        var numberRep = document.getElementById("countdownLargeScreen");
        setTimeout(function countToThree() {
          numberRep.innerHTML = "3";
          setTimeout(function countToTwo() {
            numberRep.innerHTML = "2";
            setTimeout(function countToOne() {
              numberRep.innerHTML = "1";
              if(document.getElementById("errorBanner").style.display == "flex" 
              || document.getElementById("errorStatusPage").style.display == "flex"){
                document.getElementById("containerOne").style.display = "none";
                document.getElementById("containerTwo").style.display = "none";
                document.getElementById("containerThree").style.display = "none";
                document.getElementById("containerFour").style.display = "none";
                document.getElementById("containerFive").style.display = "none";
                document.getElementById("errorStatusPage").style.display = "flex";
              }
              else{
                connectWebsocket();
              }
              setTimeout(function countToGo() {
                numberRep.innerHTML = "GO";
                //connectWebsocket();
              },1000);
            },1000);
          },1000);
        },1000);
      }
    }, 500);
  });

//Fetch temporary JWT Token and make call to Voicegain API to get websocket URL's
const connectWebsocket = async () => {
  const audioContext = new AudioContext();
  const sampleRate = audioContext.sampleRate;
  const jwtApiUrl = new URL(`${appProps.serverUrl}/api/jwt`);
  const websocketApiUrl = new URL(
    "https://api.voicegain.ai/v1/asr/transcribe/async"
  );
  const result = document.getElementById("transcriptionResult");
  result.innerHTML = "";

  try {
    let fetchTempJwtResponse = await fetch(jwtApiUrl, { method: "GET" });
    if (fetchTempJwtResponse.ok) {
      let fetchTempJwtData = await fetchTempJwtResponse.json();
      jwtToken = fetchTempJwtData.jwtToken;

      const fetchWebsocketUrl = async () => {
        const bearer = "Bearer " + jwtToken;
        const body = JSON.stringify({
          sessions: [
            {
              asyncMode: "REAL-TIME",
              websocket: { adHoc: true, minimumDelay: 175, useSTOMP: false },
            },
            {
              asyncMode: "SEMI-REAL-TIME",
              portal: { label: "sample-transcription", persist: 2000000 },
              content: {full: [
                "transcript",
                "words"
              ]},
            },
          ],
          audio: {
            source: { stream: { protocol: "WEBSOCKET" } },
            format: "F32",
            capture: true,
            rate: 16000,
          },
          settings: {
            asr: {
              noInputTimeout: 59000,
              incompleteTimeout: 69000,
            },
          },
        });
        const options = {
          body,
          method: "POST",
          headers: {
            Authorization: bearer,
            "Content-Type": "application/json",
          },
        };

        try {
          let fetchWebsocketResponse = await fetch(
            websocketApiUrl.toString(),
            options
          );
          if (fetchWebsocketResponse.ok) {
            let fetchWebsocketData = await fetchWebsocketResponse.json();
            websocketSendUrl = fetchWebsocketData.audio.stream.websocketUrl;
            websocketReceiveUrl = fetchWebsocketData.sessions[0].websocket.url;
            semiRtSessionid = fetchWebsocketData.sessions[1].sessionId;

            uuid = fetchWebsocketData.audio.capturedAudio;
            //console.log("playback uuid is : "+uuid);

            startMicrophoneCapture(websocketSendUrl, websocketReceiveUrl);
          } else throw new Error ("Unable to connect to websocket.")
        } catch (err) {
              //window.alert("Unable to start capture.");
              console.log(err.message);
              document.getElementById("errorBanner").style.display = "flex";
              document.getElementById("transcriptionContainer").style.top = "144px";
              document.getElementById("headerBar").style.marginTop = "40px";
              document.getElementById("containerOne").style.display = "none";
              document.getElementById("containerTwo").style.display = "none";
              document.getElementById("containerThree").style.display = "none";
              document.getElementById("containerFour").style.display = "none";
              document.getElementById("containerFive").style.display = "none";
              document.getElementById("errorStatusPage").style.display = "flex";
              document.getElementById("errorStatusPage").innerHTML =  "There has been a problem with JWT."+"<br><br>"+"Error Message : "+err.message;
        } finally {
            //console.log("function completed");
        }
      };

      fetchWebsocketUrl();
    } else throw new Error("Unable to fetch temporary JWT token.");
  } catch (err) {
      //window.alert("Unable to fetch temporary JWT token.");
      console.log(err.message);
      document.getElementById("errorBanner").style.display = "flex";
      document.getElementById("headerBar").style.marginTop = "40px";
      document.getElementById("transcriptionContainer").style.top = "144px";
      document.getElementById("containerOne").style.display = "none";
      document.getElementById("containerTwo").style.display = "none";
      document.getElementById("containerThree").style.display = "none";
      document.getElementById("containerFour").style.display = "none";
      document.getElementById("containerFive").style.display = "none";
      document.getElementById("errorStatusPage").style.display = "flex";
      document.getElementById("errorStatusPage").innerHTML =  "There has been a problem with JWT."+"<br><br>"+"Error Message : "+err.message;
  } finally {
      audioContext.close();
  }
};

//Start audio capturing services using microphone input
const startMicrophoneCapture = (websocketSendUrl, websocketReceiveUrl) => {
  let stopButton = document.getElementById("stop-capture-button");
  stopButton.disabled = false;

  AudioCaptureStreamingService.start(websocketSendUrl);
  let words = [];

  //Timer for single transcription with countdown display
  function countdown() {

    document.getElementById("transcriptionResult").style.color = "white"; //added

    var seconds = 61; //change to 61
    let startButton = document.getElementById("start-capture-button");
    let stopButton = document.getElementById("stop-capture-button");

    document.getElementById("status").style.display = "flex";
    showFinalizingStatus(false);
    showCaptureStatus(true);
    document.getElementById("containerThree").style.display = "none";
    document.getElementById("containerFour").style.display = "flex";
    document.getElementById("blurContainer").style.display = "flex";

    var counter = document.getElementById("timerDisplayContainer");
    counter.style.display = "flex";
    var timerDisplay = document.getElementById("timerDisplay");
    timerDisplay.style.display = "flex";
    document.getElementById("countdownLargeScreen").innerHTML = ""; //Set GO back to empty string

    function tick() {

        seconds--;

        if(seconds>=60 && seconds<120){
          timerDisplay.innerHTML = "1:" + (seconds < 70 ? "0" : "") + (String(seconds-60));
        }
        else if(seconds<60){
          timerDisplay.innerHTML = (seconds < 10 ? "0" : "") + String(seconds);
        }
        if  (startButton.disabled ==false && stopButton.disabled==false){
          if( seconds > 0 ) {
              setTimeout(tick, 1000);
          } else {
              //alert("Time over");
              console.log("Time Over");
              document.getElementById("stop-capture-button").click();

              if(document.getElementById("transcriptionResult").innerHTML.length>0){
                setTimeout(function playbackBufferTimeOne() {
                  document.getElementById("playback").disabled = false;
                  document.getElementById("playback").style.opacity = "1.0";
                  document.getElementById("playback").style.cursor = "pointer";
                }, 2000);
              }

              grecaptcha.reset();
            }}
    }
    tick();
  }

  // Start the countdown
  //countdown();

  // Connect to Websocket to receive data
  if (websocket === undefined) {
    const socket = new WebSocket(websocketReceiveUrl);
    socket.onopen = () => {
      countdown();
      console.log("Listening Now");
      socket.addEventListener("message", (event) => {
        const jsonData = JSON.parse(event.data);

        const interpretTranscriptionMessage = (message) => {
          const nGap = message.gap;
          const isGapResult = message.hasOwnProperty("gap");
          //console.log("nGap is : "+nGap+" isGapResult is : "+isGapResult );

          const isTranscriptionResult = message.hasOwnProperty("utt");
          const isWordCorrection = message.hasOwnProperty("del");
          const hasEdit = message.hasOwnProperty("edit");

          if(isGapResult && nGap>1500){ //gap set to 2 sec.
            words.push("<br>"+message.utt);
          }
          else if (isTranscriptionResult){
            words.push(message.utt);
          } else if (isWordCorrection && hasEdit) {
            const nDeletions = message.del;
            const newWords = words.slice(0, words.length - nDeletions);
            const edits = message.edit.map((it) => it.utt); //throwing issue
            newWords.push(...edits);
            words = newWords;
          } else {
            return words;
          }
        };

        interpretTranscriptionMessage(jsonData);

        const string = words.join(" ");
        const result = document.getElementById("transcriptionResult");
        result.innerHTML = string;
      });

      socket.addEventListener("close", () => {
        console.log("Websocket closed.");
        AudioCaptureStreamingService.stop(); //comment out?
      });

      socket.addEventListener("error", (event) =>
        console.log("Websocket error:", event)
      );
    };
  }
};

//Stop audio capturing services
const stopMicrophoneCapture = () => {
  showCaptureStatus(false);
  AudioCaptureStreamingService.stop();
  pollTranscript();
  pollInterval = setInterval(() => pollTranscript(), 5000);
  if (websocket !== undefined) {
    websocket.close();
    websocket = undefined;
  }
};

//Make api call to Voicegain polling for transcript to get finalized semi-real time results
const pollTranscript = async () => {
  let startButton = document.getElementById("start-capture-button");
  let stopButton = document.getElementById("stop-capture-button");
  let result = document.getElementById("transcriptionResult");
  showFinalizingStatus(true);

  const bearer = "Bearer " + jwtToken;
  try {
    startButton.disabled = true;
    stopButton.disabled = true;

    const voicegainPollUrl = new URL(
      `https://api.voicegain.ai/v1/asr/transcribe/${semiRtSessionid}`
    );
    voicegainPollUrl.searchParams.append("full", true);
    const options = {
      method: "GET",
      headers: {
        Authorization: bearer,
      },
    };

    let pollTranscriptResponse = await fetch(
      voicegainPollUrl.toString(),
      options
    );

    if (pollTranscriptResponse.ok) {
      let pollTranscriptData = await pollTranscriptResponse.json();

      if (
        pollTranscriptData.result.final === true &&
        pollTranscriptData.progress.phase !== "ERROR"
      ) {

        clearInterval(pollInterval);
        showFinalizingStatus(false);
        startButton.disabled = false;
        stopButton.disabled = true;

        //  Code for computing gap with polled words
        var pollWordGapTimes = [];

        var pollWordArray = [];
        var pollWordDuration = [];
        var pollWordTimeFromStart = [];
        //Initialize utterance,duration, and start array
        for( i=0; i<pollTranscriptData.result.words.length; i++){
          pollWordArray[i] = pollTranscriptData.result.words[i].utterance;
          pollWordDuration[i] = pollTranscriptData.result.words[i].duration;
          pollWordTimeFromStart[i] = pollTranscriptData.result.words[i].start;
        }

        pollWordGapTimes[0] = pollWordTimeFromStart[0];
        for( i=1; i<pollWordArray.length; i++){
          pollWordGapTimes[i] = pollWordTimeFromStart[i]-pollWordTimeFromStart[i-1]-pollWordDuration[i-1];
        }
        //console.log("Gaps are : "+pollWordGapTimes);
        //console.log(" duration values in array are : "+pollWordDuration);
        //console.log(" start values in array are : "+pollWordTimeFromStart);

        for( i=1; i<pollWordArray.length; i++){
          if(pollWordGapTimes[i]>1500){
            pollWordArray[i] = "<br>"+pollWordArray[i]; //replace with <br> later
          }
          else{
            pollWordArray[i] = pollWordArray[i];
          }
        }
        //console.log(" Final words in array are : "+pollWordArray);
        var finalStringResult = pollWordArray.join(" ");
        //console.log(" Final Result is : "+finalStringResult);

        //SignUp Button Style Shift
        document.getElementById("signUp").style.display = "none";
        document.getElementById("signUpTwo").style.display = "flex";

        document.getElementById("containerFour").style.display = "flex";
        document.getElementById("stopBarContainer").style.display = "none";
        document.getElementById("blurContainer").style.display = "none"; //remove blur effect
        document.getElementById("containerFive").style.display = "flex";
        document.getElementById("status").style.display = "none";
        result.innerHTML=""; //added
        result.style.display = "none";
        result.style.display = "block";
        document.getElementById("transcriptionResult").style.color = "white";
        //result.innerHTML = pollTranscriptData.result.transcript;
        result.innerHTML = finalStringResult; //added: new poll word string with computed gap time

        //Fixes text alignment in case of scroll bar
        var divTemp = document.getElementById('transcriptionContainer');
        var hs = divTemp.scrollWidth > divTemp.clientWidth;
        var vs = divTemp.scrollHeight > divTemp.clientHeight;
        if(vs==true){
          divTemp.style.alignSelf = "flex-start";
          document.getElementById('transcriptionWidthLimiter').style.alignItems = "flex-start";
        }else{
          divTemp.style.alignSelf = "center";
          document.getElementById('transcriptionWidthLimiter').style.alignItems = "center";
        }

        playbackFunction(); //calling for playback URL

      } else if (pollTranscriptData.progress.phase === "ERROR") {
        result.style.display = "block";
        let div = document.createElement("div");
        let errorText = document.createTextNode(
          "Error getting semi-real-time transcription."
        );
        div.appendChild(errorText);
        div.style.textAlign = "center";
        div.style.padding = "1rem";
      }
    } else throw new Error("Unable to poll transcript.");
  } catch (err) {
    //alert(err.message);
    console.log(err.message);
    document.getElementById("errorBanner").style.display = "flex";
    document.getElementById("headerBar").style.marginTop = "40px";
    document.getElementById("transcriptionContainer").style.top = "144px";
    document.getElementById("containerOne").style.display = "none";
    document.getElementById("containerTwo").style.display = "none";
    document.getElementById("containerThree").style.display = "none";
    document.getElementById("containerFour").style.display = "none";
    document.getElementById("containerFive").style.display = "none";
    document.getElementById("errorStatusPage").style.display = "flex";
    document.getElementById("errorStatusPage").innerHTML =  "There has been a problem during polling results."+"<br><br>"+"Error Message : "+err.message;
    showFinalizingStatus(false);
    startButton.disabled = false;
    stopButton.disabled = false;  }
};

//Show "Capturing..." in HTML when microphone capture is started
const showCaptureStatus = (isCapturing) => {
  let captureStatus = document.getElementById("capture-status");
  if (isCapturing === true){
    captureStatus.style.display = "flex";
    captureStatus.style.visibility = "visible";
  } 
  else{
    captureStatus.style.display = "none";
    captureStatus.style.visibility = "hidden";
  }
};

//Show "Finalizing..." in HTML when polling for transcript is started
const showFinalizingStatus = (isFinalizing) => {
  let captureStatus = document.getElementById("finalizing-status");
  if (isFinalizing === true){
    captureStatus.style.display = "flex";
    captureStatus.style.visibility = "visible";
    document.getElementById("stop-capture-button").style.opacity = "0.4";
    document.getElementById("stop-capture-button").style.cursor = "default";
  }
  else{
    captureStatus.style.display = "none";
    captureStatus.style.visibility = "hidden";
    document.getElementById("stop-capture-button").style.opacity = "1.0";
    document.getElementById("stop-capture-button").style.cursor = "pointer";
  }
};


//Function to copy transcript to clipboard
document
  .getElementById('copyText')
  .addEventListener('click', e => {
    // Get the text
    var copyText = document.getElementById("transcriptionResult");
    // Selects the text inside transcription container
    if (document.selection) {
      var div = document.body.createTextRange();
      div.moveToElementText(document.getElementById("transcriptionResult"));
      div.select();
    }
    else {
      var div = document.createRange();
      div.setStartBefore(document.getElementById("transcriptionResult"));
      div.setEndAfter(document.getElementById("transcriptionResult"));
      window.getSelection().addRange(div);
    }

    // Copy the text inside the selected area to clipboard
    document.execCommand("copy");
    console.log("Copied text is : " + copyText.innerHTML);
    window.getSelection().removeAllRanges(); //added

    //Copied text green light indicator ( 1 second )
    document.getElementById("copyText").style.border = "3px solid green";
    setTimeout(function copyIndicator() {
      document.getElementById("copyText").style.border = "3px solid #FFFFFF";
    }, 2000);
  });



//Function to return to first screen to retry transcription demo
document
  .getElementById('returnButton')
  .addEventListener('click', e => {
    document.getElementById("stopBarContainer").style.display = "flex";
    document.getElementById("containerFour").style.display = "none";

    document.getElementById("containerFive").style.display = "none";
    document.getElementById("status").style.display = "none";
    document.getElementById("timerDisplay").style.display = "none";
    document.getElementById("containerOne").style.display = "flex";
    document.getElementById("tryPlaybackMessage").style.display = "flex";
    document.getElementById('transcriptionContainer')
    document.getElementById('transcriptionContainer').style.alignSelf = "center";
    document.getElementById('transcriptionWidthLimiter').style.alignItems = "center";

    //SignUp Button Style Shift
    document.getElementById("signUpTwo").style.display = "none";
    document.getElementById("signUp").style.display = "flex";

    if(document.cookie.includes("count=0")){
      document.getElementById("start-capture-button").disabled = true;
      document.getElementById("checkboxContainer").style.display = "flex";
      document.getElementById("checkbox").disabled = false;
      document.getElementById("start-capture-button").style.opacity = "8%";
    }else{
      document.getElementById("checkbox").disabled = true;
      document.getElementById("checkboxContainer").style.display = "none";
      document.getElementById("start-capture-button").disabled = false;
      document.getElementById("start-capture-button").style.opacity = "1.0";
    }
    //For player reset
    document.getElementById("player").style.display = "none";
    document.getElementById("playback").disabled = true;
    document.getElementById("playback").style.opacity = "0.4";
    document.getElementById("playback").style.cursor = "default";
    //reset time bar also
    let barLength = timerWrapper.clientWidth * (0/media.duration);
    timerBar.style.width = barLength + 'px';
  });


//Function to playback audio using UUID
const playbackFunction = async () => {
    try {
      const bearer = "Bearer " + jwtToken;
      const voicegainPlaybackUrl = new URL(
        `https://api.voicegain.ai/v1/data/${uuid}/file`
      );
      voicegainPlaybackUrl.searchParams.append("full", true);
      const options = {
        method: "GET",
        headers: {
          Authorization: bearer,
        },
      };
      let playbackResponse = await fetch(
        voicegainPlaybackUrl.toString(),
        options
      );

      if (playbackResponse.ok) {  // convert to blob and url file

        let data = await playbackResponse.blob();
        let blob = new Blob([data], {type: "audio"});
        const url = window.URL.createObjectURL(blob);
        let myPlaybackAudio = document.getElementById("myPlaybackAudio");
        //myPlaybackAudio.style.display = "none"; //added to fix ios issue
        myPlaybackAudio.setAttribute("src", url);
        document.getElementById("downloadLink").href = url;//Set the download button to current audio file url

        myPlaybackAudio.onloadedmetadata = function() {
          console.log("Audio duration is : "+myPlaybackAudio.duration);
        };


    } else throw new Error("Unable to get playback file.");
    } catch (err) {
      //alert(err.message);
      console.log(err.message);
  }
};

// On click function for playback button...disable button when uuid=undefined or null(done in stop-capture click listener)
document
  .getElementById('playback')
  .addEventListener('click', e => {
    //playbackFunction(); //call this after polling instead
    document.getElementById("tryPlaybackMessage").style.display = "none";
    document.getElementById("player").style.display = "block";
    document.getElementById("playback").disabled = true;
    document.getElementById("playback").style.opacity = "0.4";
    document.getElementById("playback").style.cursor = "default";


    let myPlaybackAudio = document.getElementById("myPlaybackAudio");

    myPlaybackAudio.onended = function(){
      console.log("Playback audio has ended");
    };
});



// Audio Player Controls Below:
const media = document.getElementById("myPlaybackAudio");
const player = document.getElementById("player");
const controls = document.querySelector('.controls');

const play = document.querySelector('.play');
const stop = document.querySelector('.stop');
const rwd = document.querySelector('.rwd');
const fwd = document.querySelector('.fwd');
const download = document.querySelector('.download');
const exit = document.querySelector('.exit');

const timerWrapper = document.querySelector('.timer');
const timer = document.querySelector('.timer span');
const timerBar = document.querySelector('.timer div');


media.removeAttribute('controls');
controls.style.visibility = 'visible';

//Playing and pausing the audio
play.addEventListener('click', playPauseMedia);
function playPauseMedia() {

    rwd.classList.remove('active');
    fwd.classList.remove('active');
    clearInterval(intervalRwd);
    clearInterval(intervalFwd);

    if(media.paused) {
      play.setAttribute('data-icon','u');
      media.play();
    } else {
      play.setAttribute('data-icon','P');
      media.pause();
    }
  }

//Stopping the audio
stop.addEventListener('click', stopMedia);
media.addEventListener('ended', stopMedia);
function stopMedia() {
    media.pause();
    media.currentTime = 0;
    play.setAttribute('data-icon','P');


    //added : Fixing play and pause
    rwd.classList.remove('active');
    fwd.classList.remove('active');
    clearInterval(intervalRwd);
    clearInterval(intervalFwd);
}


//Seeking back and forth
rwd.addEventListener('click', mediaBackward);
fwd.addEventListener('click', mediaForward);

let intervalFwd;
let intervalRwd;

function mediaBackward() {
  clearInterval(intervalFwd);
  fwd.classList.remove('active');

  if(rwd.classList.contains('active')) {
    rwd.classList.remove('active');
    clearInterval(intervalRwd);
    media.play();
  } else {
    rwd.classList.add('active');
    media.pause();
    intervalRwd = setInterval(windBackward, 200);
  }
}

function mediaForward() {
  clearInterval(intervalRwd);
  rwd.classList.remove('active');

  if(fwd.classList.contains('active')) {
    fwd.classList.remove('active');
    clearInterval(intervalFwd);
    media.play();
  } else {
    fwd.classList.add('active');
    media.pause();
    intervalFwd = setInterval(windForward, 200);
  }
}

function windBackward() {
    if(media.currentTime <= 3) {
      rwd.classList.remove('active');
      clearInterval(intervalRwd);
      stopMedia();
    } else {
      media.currentTime -= 3;
    }
  }

function windForward() {
    if(media.currentTime >= media.duration - 3) {
      fwd.classList.remove('active');
      clearInterval(intervalFwd);
      stopMedia();
    } else {
      media.currentTime += 3;
    }
}



//Updating the elapsed time
media.addEventListener('timeupdate', setTime);

function setTime() {
    let minutes = Math.floor(media.currentTime / 60);
    let seconds = Math.floor(media.currentTime - minutes * 60);
    let minuteValue;
    let secondValue;
  
    if (minutes < 10) {
      minuteValue = '0' + minutes;
    } else {
      minuteValue = minutes;
    }
  
    if (seconds < 10) {
      secondValue = '0' + seconds;
    } else {
      secondValue = seconds;
    }
  
    let mediaTime = minuteValue + ':' + secondValue;
    timer.textContent = mediaTime;
  
    let barLength = timerWrapper.clientWidth * (media.currentTime/media.duration);
    timerBar.style.width = barLength + 'px';
  }

// Click listener for exit button in audio player
exit.addEventListener('click', exitMedia);
function exitMedia() {
  document.getElementById("player").style.display = "none";
  document.getElementById("playback").disabled = false;
  document.getElementById("playback").style.opacity = "1.0";
  document.getElementById("playback").style.cursor = "pointer";

  media.pause(); //Pause audio on close
  play.setAttribute('data-icon','P');
  console.log("hidden playback interface");
}

//Scrollbar event listener
window.addEventListener('resize', e => {
  var divTemp = document.getElementById('transcriptionContainer');
  var vs = divTemp.scrollHeight > divTemp.clientHeight;
  if(vs==true){
    document.getElementById('transcriptionContainer').style.alignSelf = "flex-start";
    document.getElementById('transcriptionWidthLimiter').style.alignItems = "flex-start";
  }else{
    divTemp.style.alignSelf = "center";
    document.getElementById('transcriptionWidthLimiter').style.alignItems = "center";
  }
})
