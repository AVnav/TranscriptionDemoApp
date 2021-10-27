let jwtTokenOne, pollIntervalOne;

function imNotARobot() {
  setTimeout(function runThree() {
    if (
      document.getElementById("fileInfoMessages").innerHTML.length <= 1 ||
      document
        .getElementById("fileInfoMessages")
        .innerHTML.includes("Your File exceeds the maximum file size") ||
      document
        .getElementById("fileInfoMessages")
        .innerHTML.includes("This file type is not allowed")
    ) {
      setTimeout(runThree, 1000);
    } else {
      document.getElementById("startTranscribeButton").disabled = false;
      document.getElementById("startTranscribeButton").style.opacity = "1.0";
      document.getElementById("startTranscribeButton").style.cursor = "pointer";
    }
  }, 1000);
}

document
  .getElementById("startTranscribeButton")
  .addEventListener("click", (e) => {
    fetchTempJwt(); //Starts process  ... add a check to see if file is added

    document.getElementById("playbackTwo").disabled = true;
    document.getElementById("playbackTwo").style.opacity = "0.4";
    document.getElementById("playbackTwo").style.cursor = "default";
  });

// eslint-disable-next-line no-unused-vars
const fetchTempJwt = async () => {
  const apiUrl = `${appProps.serverUrl}/api/jwt`;
  const selectedFile = document.getElementById("fileselect").files[0];

  if (selectedFile) {
    try {
      let fetchTempJwtResponse = await fetch(apiUrl, { method: "GET" });
      if (fetchTempJwtResponse.ok) {
        let fetchTempJwtData = await fetchTempJwtResponse.json();
        jwtTokenOne = fetchTempJwtData.jwtToken;
        uploadFile(jwtTokenOne, selectedFile);
      } else throw new Error("Unable to fetch temporary JWT token.");
    } catch (err) {
      console.log(err.message);
      document.getElementById("errorBanner").style.display = "flex";
      document.getElementById("headerBar").style.marginTop = "40px";
      document.getElementById("containerOne").style.display = "none";
      document.getElementById("containerTwo").style.display = "none";
      document.getElementById("containerThree").style.display = "none";
      document.getElementById("containerFour").style.display = "none";
      document.getElementById("containerFive").style.display = "none";
      document.getElementById("containerSix").style.display = "none";
      document.getElementById("containerSeven").style.display = "none";
      document.getElementById("containerEight").style.display = "none";
      document.getElementById("errorStatusPage").style.display = "flex";
      document.getElementById("errorStatusPage").innerHTML =
        "There has been a problem with JWT validation." +
        "<br><br>" +
        "Error Message : " +
        err.message;
    }
  }
};

const uploadFile = async (jwtToken, file) => {
  //console.log("Upload File function called");
  let transcriptResult = document.getElementById("transcript-result");
  try {
    const bearer = "Bearer " + jwtToken;
    const voicegainUploadUrl = new URL("https://api.voicegain.ai/v1/data/file");
    voicegainUploadUrl.searchParams.append("reuse", false);
    const formData = new FormData();
    const removeNonAlphaNumericChars = (string) =>
      string.replace(/[^0-9a-z]/gi, "");
    formData.append("file", file, removeNonAlphaNumericChars(file.name));
    const body = formData;
    const options = {
      body,
      method: "POST",
      headers: {
        Authorization: bearer,
      },
    };

    let uploadFileResponse = await fetch(
      voicegainUploadUrl.toString(),
      options
    );

    if (uploadFileResponse.ok) {
      let uploadFileData = await uploadFileResponse.json();
      startAsyncTranscribe(
        bearer,
        uploadFileData.name,
        uploadFileData.objectId
      );
    } else throw new Error("Unable to upload File.");
  } catch (err) {
    console.log(err.message);
    document.getElementById("errorBanner").style.display = "flex";
    document.getElementById("headerBar").style.marginTop = "40px";
    document.getElementById("containerOne").style.display = "none";
    document.getElementById("containerTwo").style.display = "none";
    document.getElementById("containerThree").style.display = "none";
    document.getElementById("containerFour").style.display = "none";
    document.getElementById("containerFive").style.display = "none";
    document.getElementById("containerSix").style.display = "none";
    document.getElementById("containerSeven").style.display = "none";
    document.getElementById("containerEight").style.display = "none";
    document.getElementById("errorStatusPage").style.display = "flex";
    document.getElementById("errorStatusPage").innerHTML =
      "There has been a problem during file upload process." +
      "<br><br>" +
      "Error Message : " +
      err.message;
  }
};

const startAsyncTranscribe = async (bearer, label, objectId) => {
  console.log("starting async transcribe...");
  try {
    const voicegainTranscribeUrl = new URL(
      "https://api.voicegain.ai/v1/asr/transcribe/async"
    );
    const body = JSON.stringify({
      sessions: [
        {
          asyncMode: "OFF-LINE",
          content: { full: ["transcript", "words"] },
          poll: { persist: 5000, afterlife: 5000 },
          portal: { label, persist: 604800000 },
        },
      ],
      audio: { source: { dataStore: { uuid: objectId } } },
    });
    const options = {
      body,
      method: "POST",
      headers: {
        Authorization: bearer,
        "Content-Type": "application/json",
      },
    };

    let asyncTranscribeResponse = await fetch(
      voicegainTranscribeUrl.toString(),
      options
    );

    if (asyncTranscribeResponse.ok) {
      let asyncTranscribeData = await asyncTranscribeResponse.json();
      pollIntervalOne = setInterval(
        () =>
          pollTranscriptOne(bearer, asyncTranscribeData.sessions[0].sessionId),
        5000
      );
    } else throw new Error("Unable to start async transcription.");
  } catch (err) {
    alert(err.message);
    console.log(err.message);
  }
};

const pollTranscriptOne = async (bearer, sessionId) => {
  //console.log("Polling Transcript Function called");
  try {
    const voicegainPollUrl = new URL(
      `https://api.voicegain.ai/v1/asr/transcribe/${sessionId}`
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
      setTranscriptionStatus(pollTranscriptData.progress.phase);

      if (pollTranscriptData.result.final === true) {
        clearInterval(pollIntervalOne);
/*        document.getElementById("containerSix").style.display = "none";
        document.getElementById("containerEight").style.display = "none";
        document.getElementById("containerSeven").style.display = "flex";

        document.getElementById("signUp").style.display = "none";
        document.getElementById("signUpTwo").style.display = "flex";
*/
        let transcriptResult = document.getElementById("transcript-result");
        //transcriptResult.innerHTML = pollTranscriptData.result.transcript;

        //Function to get downloadable files from url --JSON
        const voicegainDownloadableUrl_json = new URL(
          `https://api.voicegain.ai/v1//asr/transcribe/${sessionId}/transcript?format=json`
        );
        voicegainDownloadableUrl_json.searchParams.append("full", true);
        const options = {
          method: "GET",
          headers: {
            Authorization: bearer,
            "Content-Type": "application/json",
          },
        };

        let downloadableTranscriptResponse_json = await fetch(
          voicegainDownloadableUrl_json.toString(),
          options
        );

        if (downloadableTranscriptResponse_json.ok) {
          let downloadableTranscriptData_json =
            await downloadableTranscriptResponse_json.blob();
          console.log(downloadableTranscriptData_json);

          //Set the download button to current file url
          let textSaveBlob_json = new Blob([downloadableTranscriptData_json], {
            type: "application/json",
          });
          let json_FileURL = window.URL.createObjectURL(textSaveBlob_json);
          document.getElementById("download_jsonLink").href = json_FileURL;
        } else throw new Error("Unable to obtain json downloadable file.");

        //Function to get downloadable files from url
        const voicegainDownloadableUrl_text = new URL(
          `https://api.voicegain.ai/v1//asr/transcribe/${sessionId}/transcript?format=text&interval=15`
        );
        voicegainDownloadableUrl_text.searchParams.append("full", true);

        let downloadableTranscriptResponse_text = await fetch(
          voicegainDownloadableUrl_text.toString(),
          options
        );

        if (downloadableTranscriptResponse_text.ok) {
          let downloadableTranscriptData_text =
            await downloadableTranscriptResponse_text.blob();
          console.log(downloadableTranscriptData_text);

          //Set the download button to current file url
          let textSaveBlob_txt = new Blob([downloadableTranscriptData_text], {
            type: "text/plain",
          });
          let txt_FileURL = window.URL.createObjectURL(textSaveBlob_txt);
          document.getElementById("download_txtLink").href = txt_FileURL;

          //Indentation using interval below
          fetch(txt_FileURL)
            .then( r => r.text() )
            .then( t => {
              t = t.replace(/\n\[\d\:\d\d\:\d\d\.\d\d\d\]/gi, "<br><br>");
              t = t.replace(/\[\d\:\d\d\:\d\d\.\d\d\d\]/gi, "<br><br>");

              document.getElementById("containerSix").style.display = "none";
              document.getElementById("containerEight").style.display = "none";
              document.getElementById("containerSeven").style.display = "flex";

              document.getElementById("giftBanner").style.display = "flex";
              document.getElementById("headerBar").style.marginTop = "40px";
              document.getElementById("signUp").style.display = "none";
              document.getElementById("signUpTwo").style.display = "flex";
              transcriptResult.innerHTML = t;
              playbackFunctionTwo(); //calling for playback URL

              //Fixes text alignment in case of scroll bar
              var divTempTwo = document.getElementById("transcriptionContainerTwo");
              var hsB = divTempTwo.scrollWidth > divTempTwo.clientWidth;
              var vsB = divTempTwo.scrollHeight > divTempTwo.clientHeight;
              if (vsB == true) {
                divTempTwo.style.alignSelf = "flex-start";
                document.getElementById(
                  "transcriptionWidthLimiterTwo"
                ).style.alignItems = "flex-start";
              } else {
                divTempTwo.style.alignSelf = "center";
                document.getElementById(
                  "transcriptionWidthLimiterTwo"
                ).style.alignItems = "center";
              }
            })
        } else throw new Error("Unable to obtain text downloadable file.");

        //Function to get downloadable files from url --srt
        const voicegainDownloadableUrl_srt = new URL(
          `https://api.voicegain.ai/v1//asr/transcribe/${sessionId}/transcript?format=srt`
        );
        voicegainDownloadableUrl_srt.searchParams.append("full", true);

        let downloadableTranscriptResponse_srt = await fetch(
          voicegainDownloadableUrl_srt.toString(),
          options
        );

        if (downloadableTranscriptResponse_srt.ok) {
          let downloadableTranscriptData_srt =
            await downloadableTranscriptResponse_srt.blob();
          console.log(downloadableTranscriptData_srt);

          //Set the download button to current file url
          let textSaveBlob_srt = new Blob([downloadableTranscriptData_srt], {
            type: "text/srt",
          });
          let srt_FileURL = window.URL.createObjectURL(textSaveBlob_srt);
          document.getElementById("download_srtLink").href = srt_FileURL;
        } else throw new Error("Unable to obtain srt downloadable file.");

        //Function to get downloadable files from url --vtt
        const voicegainDownloadableUrl_vtt = new URL(
          `https://api.voicegain.ai/v1//asr/transcribe/${sessionId}/transcript?format=vtt`
        );
        voicegainDownloadableUrl_vtt.searchParams.append("full", true);

        let downloadableTranscriptResponse_vtt = await fetch(
          voicegainDownloadableUrl_vtt.toString(),
          options
        );

        if (downloadableTranscriptResponse_vtt.ok) {
          let downloadableTranscriptData_vtt =
            await downloadableTranscriptResponse_vtt.blob();
          console.log(downloadableTranscriptData_vtt);

          //Set the download button to current file url
          let textSaveBlob_vtt = new Blob([downloadableTranscriptData_vtt], {
            type: "text/vtt",
          });
          let vtt_FileURL = window.URL.createObjectURL(textSaveBlob_vtt);
          document.getElementById("download_vttLink").href = vtt_FileURL;
        } else throw new Error("Unable to obtain vtt downloadable file.");

        //Function to get downloadable files from url --ttml
        const voicegainDownloadableUrl_ttml = new URL(
          `https://api.voicegain.ai/v1//asr/transcribe/${sessionId}/transcript?format=ttml`
        );
        voicegainDownloadableUrl_ttml.searchParams.append("full", true);

        let downloadableTranscriptResponse_ttml = await fetch(
          voicegainDownloadableUrl_ttml.toString(),
          options
        );

        if (downloadableTranscriptResponse_ttml.ok) {
          let downloadableTranscriptData_ttml =
            await downloadableTranscriptResponse_ttml.blob();
          console.log(downloadableTranscriptData_ttml);

          //Set the download button to current file url
          let textSaveBlob_ttml = new Blob([downloadableTranscriptData_ttml], {
            type: "text/ttml",
          });
          let ttml_FileURL = window.URL.createObjectURL(textSaveBlob_ttml);
          document.getElementById("download_ttmlLink").href = ttml_FileURL;
        } else throw new Error("Unable to obtain ttml downloadable file.");
        document.getElementById("downloadTypes").disabled = false;
        document.getElementById("downloadTypes").style.opacity = "1.0";
        document.getElementById("downloadTypes").style.cursor = "pointer";
      }
    } else throw new Error("Unable to poll transcript.");
  } catch (err) {
    //alert(err.message);
    console.log(err.message);
  } finally {
  }
};

const setTranscriptionStatus = (phase) => {
  let statusTag = document.getElementById("statusTag");
  switch (phase) {
    case "ACCEPTED":
      statusTag.innerHTML = "ACCEPTED...";
      break;
    case "QUEUED":
      statusTag.innerHTML = "QUEUED...";
      break;
    case "FETCHING":
      statusTag.innerHTML = "FETCHING...";
      break;
    case "FETCHED":
      statusTag.innerHTML = "FETCHED...";
      break;
    case "PROCESSING":
      statusTag.innerHTML = "PROCESSING...";
      break;
    case "DONE":
      statusTag.innerHTML = "DONE...";
      break;
    case "STOPPED":
      statusTag.innerHTML = "STOPPED...";
      break;
    case "ERROR":
      statusTag.innerHTML = "ERROR...";
      break;
    default:
      break;
  }
};

//Function to copy transcript to clipboard
document.getElementById("copyTextTwo").addEventListener("click", (e) => {
  // Get the text
  var copyTextTwo = document.getElementById("transcript-result");
  // Selects the text inside transcription container
  if (document.selection) {
    var div = document.body.createTextRange();
    div.moveToElementText(document.getElementById("transcript-result"));
    div.select();
  } else {
    var div = document.createRange();
    div.setStartBefore(document.getElementById("transcript-result"));
    div.setEndAfter(document.getElementById("transcript-result"));
    window.getSelection().addRange(div);
  }

  // Copy the text inside the selected area to clipboard
  document.execCommand("copy");
  console.log("Copied text is : " + copyTextTwo.innerHTML);
  window.getSelection().removeAllRanges(); //added

  //Copied text green light indicator ( 1 second )
  document.getElementById("copyTextTwo").style.border = "3px solid green";
  setTimeout(function copyIndicator() {
    document.getElementById("copyTextTwo").style.border = "3px solid #FFFFFF";
  }, 2000);
});

//Function to return to first screen to retry transcription demo
document.getElementById("returnButtonTwo").addEventListener("click", (e) => {
  document.getElementById("stopBarContainer").style.display = "flex";
  document.getElementById("containerFour").style.display = "none";

  document.getElementById("containerFive").style.display = "none";
  document.getElementById("containerSix").style.display = "none";
  document.getElementById("containerSeven").style.display = "none";
  document.getElementById("containerEight").style.display = "none";

  document.getElementById("status").style.display = "none";
  document.getElementById("timerDisplay").style.display = "none";
  document.getElementById("containerOne").style.display = "flex";
  document.getElementById("tryPlaybackMessage").style.display = "flex";

  document.getElementById("giftBanner").style.display = "none";
  document.getElementById("headerBar").style.marginTop = "0px";
  document.getElementById("wrongFileZone").style.display = "none";
  document.getElementById("deleteFileZone").style.display = "none";
  document.getElementById("importBox").style.display = "flex";

  // Clear files file upload storage
  document.getElementById('fileselect').value = "";
  document.getElementById("fileInfoMessages").innerHTML = "";

  document.getElementById("downloadPopup").style.display = "none";
  document.getElementById("downloadTypes").disabled = true;
  document.getElementById("downloadTypes").style.opacity = "0.4";
  document.getElementById("downloadTypes").style.cursor = "default";

  document.getElementById("startTranscribeButton").disabled = true;
  document.getElementById("startTranscribeButton").style.opacity = "0.4";
  document.getElementById("startTranscribeButton").style.cursor = "default";

  document.getElementById("transcriptionContainerTwo").style.alignSelf =
    "center";
  document.getElementById("transcriptionWidthLimiterTwo").style.alignItems =
    "center";

  //SignUp Button Style Shift
  document.getElementById("signUpTwo").style.display = "none";
  document.getElementById("signUp").style.display = "flex";

  if (document.cookie.includes("count=0")) {
    document.getElementById(
      "start-offlineTranscription-button"
    ).disabled = true;
    document.getElementById("checkboxContainer").style.display = "flex";
    document.getElementById("checkbox").disabled = false;
    document.getElementById("start-offlineTranscription-button").style.opacity =
      "8%";
  } else {
    document.getElementById("checkbox").disabled = true;
    document.getElementById("checkboxContainer").style.display = "none";
    document.getElementById(
      "start-offlineTranscription-button"
    ).disabled = false;
    document.getElementById("start-offlineTranscription-button").style.opacity =
      "1.0";
  }
  //For player reset
  document.getElementById("player").style.display = "none";
  document.getElementById("playback").disabled = true;
  document.getElementById("playback").style.opacity = "0.4";
  document.getElementById("playback").style.cursor = "default";

  //reset time bar also
  let barLengthTwo = timerWrapperTwo.clientWidth * (0/mediaTwo.duration);
  timerBarTwo.style.width = barLengthTwo + 'px';
});

document.getElementById("downloadTypes").addEventListener("click", (e) => {
  if (document.getElementById("downloadPopup").style.display == "flex") {
    document.getElementById("downloadPopup").style.display = "none";
  } else {
    document.getElementById("downloadPopup").style.display = "flex";
  }

  if(document.getElementById("playerTwo").style.display == "block"){
    document.getElementById("exitTwo").click();
  }
});

//After clicking popup transcribe button
document
  .getElementById("startTranscribeButton")
  .addEventListener("click", (e) => {
    document.getElementById("containerOne").style.display = "none";
    document.getElementById("containerTwo").style.display = "none";
    document.getElementById("containerSix").style.display = "none";
    document.getElementById("containerOne").style.opacity = "1";
    document.getElementById("containerEight").style.display = "flex";
    document.getElementById("statusTag").innerHTML = "WAITING...";
  });

// On closing offline captcha card popup
document.getElementById("closeButton").addEventListener("click", (e) => {
  document.getElementById("containerOne").style.display = "flex";
  document.getElementById("containerOne").style.opacity = "1.0";
  document.getElementById("containerSix").style.display = "none";
});

//Scrollbar event listener
window.addEventListener("resize", (e) => {
  var divTempTwo = document.getElementById("transcriptionContainerTwo");
  var vsB = divTempTwo.scrollHeight > divTempTwo.clientHeight;
  if (vsB == true) {
    document.getElementById("transcriptionContainerTwo").style.alignSelf =
      "flex-start";
    document.getElementById("transcriptionWidthLimiterTwo").style.alignItems =
      "flex-start";
  } else {
    divTempTwo.style.alignSelf = "center";
    document.getElementById("transcriptionWidthLimiterTwo").style.alignItems =
      "center";
  }
});

// On click function for playback button...disable button when uuid=undefined or null(done in stop-capture click listener)
document
  .getElementById('playbackTwo')
  .addEventListener('click', e => {
    //playbackFunction(); //call this after polling instead
    document.getElementById("playerTwo").style.display = "block";
    document.getElementById("playbackTwo").disabled = true;
    document.getElementById("playbackTwo").style.opacity = "0.4";
    document.getElementById("playbackTwo").style.cursor = "default";


    let myPlaybackAudioTwo = document.getElementById("myPlaybackAudioTwo");

    myPlaybackAudioTwo.onended = function(){
      console.log("Playback audio has  for offline transcription");
    };

    if(document.getElementById("downloadPopup").style.display == "flex"){
      document.getElementById("downloadTypes").click();
      document.getElementById("playerTwo").style.display = "block";
      document.getElementById("playbackTwo").disabled = true;
      document.getElementById("playbackTwo").style.opacity = "0.4";
      document.getElementById("playbackTwo").style.cursor = "default";
    }
});

//Function to playback audio using UUID
const playbackFunctionTwo = async () => {

  const dataTwo = document.getElementById("fileselect").files[0];

  //let dataTwo = await playbackResponseTwo.blob();
  let blobTwo = new Blob([dataTwo], {type: "audio"});
  const urlTwo = window.URL.createObjectURL(blobTwo);
  let myPlaybackAudioTwo = document.getElementById("myPlaybackAudioTwo");
  //myPlaybackAudio.style.display = "none"; //added to fix ios issue
  myPlaybackAudioTwo.setAttribute("src", urlTwo);
  document.getElementById("downloadLinkTwo").href = urlTwo;//Set the download button to current audio file url

  myPlaybackAudioTwo.onloadedmetadata = function() {
    console.log("Audio duration of offline transcription is : "+myPlaybackAudioTwo.duration);
  };
  document.getElementById("playbackTwo").disabled = false;
  document.getElementById("playbackTwo").style.opacity = "1.0";
  document.getElementById("playbackTwo").style.cursor = "pointer";
}

// Audio Player Controls Below:
const mediaTwo = document.getElementById("myPlaybackAudioTwo");
const playerTwo = document.getElementById("playerTwo");
const controlsTwo = document.querySelector('.controlsTwo');

const playTwo = document.querySelector('.playTwo');
const stopTwo = document.querySelector('.stopTwo');
const rwdTwo = document.querySelector('.rwdTwo');
const fwdTwo = document.querySelector('.fwdTwo');
const downloadTwo = document.querySelector('.downloadTwo');
const exitTwo = document.querySelector('.exitTwo');

const timerWrapperTwo = document.querySelector('.timerTwo');
const timerTwo = document.querySelector('.timerTwo span');
const timerBarTwo = document.querySelector('.timerTwo div');


mediaTwo.removeAttribute('controls');
controlsTwo.style.visibility = 'visible';

//Playing and pausing the audio
playTwo.addEventListener('click', playPauseMediaTwo);
function playPauseMediaTwo() {

    rwdTwo.classList.remove('active');
    fwdTwo.classList.remove('active');
    clearInterval(intervalRwdTwo);
    clearInterval(intervalFwdTwo);

    if(mediaTwo.paused) {
      playTwo.setAttribute('data-icon','u');
      mediaTwo.play();
    } else {
      playTwo.setAttribute('data-icon','P');
      mediaTwo.pause();
    }
  }

//Stopping the audio
stopTwo.addEventListener('click', stopMediaTwo);
mediaTwo.addEventListener('ended', stopMediaTwo);
function stopMediaTwo() {
    mediaTwo.pause();
    mediaTwo.currentTime = 0;
    playTwo.setAttribute('data-icon','P');


    //added : Fixing play and pause
    rwdTwo.classList.remove('active');
    fwdTwo.classList.remove('active');
    clearInterval(intervalRwdTwo);
    clearInterval(intervalFwdTwo);
}


//Seeking back and forth
rwdTwo.addEventListener('click', mediaBackwardTwo);
fwdTwo.addEventListener('click', mediaForwardTwo);

let intervalFwdTwo;
let intervalRwdTwo;

function mediaBackwardTwo() {
  clearInterval(intervalFwdTwo);
  fwdTwo.classList.remove('active');

  if(rwdTwo.classList.contains('active')) {
    rwdTwo.classList.remove('active');
    clearInterval(intervalRwdTwo);
    mediaTwo.play();
  } else {
    rwdTwo.classList.add('active');
    mediaTwo.pause();
    intervalRwdTwo = setInterval(windBackwardTwo, 200);
  }
}

function mediaForwardTwo() {
  clearInterval(intervalRwdTwo);
  rwdTwo.classList.remove('active');

  if(fwdTwo.classList.contains('active')) {
    fwdTwo.classList.remove('active');
    clearInterval(intervalFwdTwo);
    mediaTwo.play();
  } else {
    fwdTwo.classList.add('active');
    mediaTwo.pause();
    intervalFwdTwo = setInterval(windForwardTwo, 200);
  }
}

function windBackwardTwo() {
    if(mediaTwo.currentTime <= 3) {
      rwdTwo.classList.remove('active');
      clearInterval(intervalRwdTwo);
      stopMediaTwo();
    } else {
      mediaTwo.currentTime -= 3;
    }
  }

function windForwardTwo() {
    if(mediaTwo.currentTime >= mediaTwo.duration - 3) {
      fwdTwo.classList.remove('active');
      clearInterval(intervalFwdTwo);
      stopMediaTwo();
    } else {
      mediaTwo.currentTime += 3;
    }
}



//Updating the elapsed time
mediaTwo.addEventListener('timeupdate', setTimeTwo);

function setTimeTwo() {
    let minutesTwo = Math.floor(mediaTwo.currentTime / 60);
    let secondsTwo = Math.floor(mediaTwo.currentTime - minutesTwo * 60);
    let minuteValueTwo;
    let secondValueTwo;

    if (minutesTwo < 10) {
      minuteValueTwo = '0' + minutesTwo;
    } else {
      minuteValueTwo = minutesTwo;
    }

    if (secondsTwo < 10) {
      secondValueTwo = '0' + secondsTwo;
    } else {
      secondValueTwo = secondsTwo;
    }

    let mediaTimeTwo = minuteValueTwo + ':' + secondValueTwo;
    timerTwo.textContent = mediaTimeTwo;

    let barLengthTwo = timerWrapperTwo.clientWidth * (mediaTwo.currentTime/mediaTwo.duration);
    timerBarTwo.style.width = barLengthTwo + 'px';
  }

// Click listener for exit button in audio player
exitTwo.addEventListener('click', exitMediaTwo);
function exitMediaTwo() {
  document.getElementById("playerTwo").style.display = "none";
  document.getElementById("playbackTwo").disabled = false;
  document.getElementById("playbackTwo").style.opacity = "1.0";
  document.getElementById("playbackTwo").style.cursor = "pointer";

  mediaTwo.pause(); //Pause audio on close
  playTwo.setAttribute('data-icon','P');
  console.log("hidden playback interface");
}

