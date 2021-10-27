//Renders the captcha widget
window.onloadCallback = onloadCallback;
var onloadCallback = function () {
  console.log("captcha rendered");
  grecaptcha.render("reCaptcha", {
    sitekey : appProps.reCaptchaSiteKey,
  });
  grecaptcha.render("reCaptchaTwo", {
    sitekey : appProps.reCaptchaSiteKey,
  });
  const captcha = (document.querySelector("#g-recaptcha-response").value = "");
};

//Set title of browser website
document.title = "Voicegain Speech-to-Text Demo";

//Get captcha state from div tag and send to server side for validation. Then receive results back from server to display.
document
  .getElementById("start-capture-button")
  .addEventListener("click", (e) => {
    //e.preventDefault(); //prevents clicking start
    document.getElementById("containerOne").style.opacity = "0.4";
    document.getElementById("containerTwo").style.display = "flex";//popup new modal
    document.getElementById("checkbox").disabled = true;
    document.getElementById("playback").disabled = true;
    document.getElementById("playback").style.opacity = "0.4";
    document.getElementById("playback").style.cursor = "default";

    //Recursive timeouts to check for captcha click before sending for verification (Similar function used in microphone-capture.js to start session)
    setTimeout(function run() {
      const captcha = document.querySelector("#g-recaptcha-response").value;
      if (captcha.length < 3) {
        //console.log("Index Timeout Reset");
        setTimeout(run, 500);
      }
      if (captcha.length > 3) {
        //console.log("captcha body is : " + captcha);

        return fetch(`${appProps.serverUrl}/submit`, {
          method: "POST",
          headers: {
            Accept: "*/*",
            "Content-type": "application/json",
          },
          body: JSON.stringify({ captcha: captcha }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log(data);
            if (!data.success) {
              console.log("reClick");
              document.getElementById("errorBanner").style.display = "flex";
              document.getElementById("headerBar").style.marginTop = "40px";
              document.getElementById("transcriptionContainer").style.top = "144px";
              document.getElementById("containerOne").style.display = "none";
              document.getElementById("containerTwo").style.display = "none";
              document.getElementById("containerThree").style.display = "none";
              document.getElementById("containerFour").style.display = "none";
              document.getElementById("containerFive").style.display = "none";
              document.getElementById("errorStatusPage").style.display = "flex";
              document.getElementById("errorStatusPage").innerHTML =  "Error Status : "+data.error.status+"<br>"+"Error Message : "+data.error.message;
            }
            if (data.success) {
              //alert(data.message);
            }
          })
          .catch((error) => {
            console.log("Error: " + error);
            //add error banner here
            document.getElementById("errorBanner").style.display = "flex";
            document.getElementById("headerBar").style.marginTop = "40px";
            document.getElementById("transcriptionContainer").style.top = "144px";
            document.getElementById("containerOne").style.display = "none";
            document.getElementById("containerTwo").style.display = "none";
            document.getElementById("containerThree").style.display = "none";
            document.getElementById("containerFour").style.display = "none";
            document.getElementById("containerFive").style.display = "none";
            document.getElementById("errorStatusPage").style.display = "flex";
            document.getElementById("errorStatusPage").innerHTML =  "Error Message : "+error;
          });
      }
    }, 500);
  });

//Setting initial state of buttons on loading browser screen
function defaultButtonState() {
  //onloadCallback(); //Calling captcha render here instead of in HTML due to bugs
  document.getElementById("containerOne").style.display = "flex";
  document.getElementById("containerOne").style.opacity = "1";
  document.getElementById("containerTwo").style.display = "none";
  document.getElementById("containerThree").style.display = "none";
  document.getElementById("containerFour").style.display = "none";
  document.getElementById("containerFive").style.display = "none";
  document.getElementById("containerSix").style.display = "none";
  document.getElementById("containerSeven").style.display = "none";
  document.getElementById("containerEight").style.display = "none";

  //document.getElementById("start-capture-button").disabled = false;
  document.getElementById("status").style.display = "none";
  document.getElementById("checkbox").disabled = false;
  document.getElementById("errorBanner").style.display = "none";
  document.getElementById("headerBar").style.marginTop = "0px";
  document.getElementById("timeoutBanner").style.display = "none";
  document.getElementById("tryPlaybackMessage").style.display = "flex";

  if(document.cookie.includes("count=0") || document.cookie.includes("NaN")){
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


  //const captcha = (document.querySelector("#g-recaptcha-response").value = "");
  let result = document.getElementById("transcriptionResult");
  console.log(document.cookie);
  //result.innerHTML = "Your conversation will be recorded here!";
  if (document.cookie.includes("closed")) {
    document.getElementById("containerTwo").style.display = "none";
    document.getElementById("containerSix").style.display = "none";
    document.getElementById("containerOne").style.display = "flex";
    document.getElementById("containerOne").style.opacity = "1.0";
    startButton.disabled = true;
    startButton.style.cursor = "default";
    startButton.style.opacity = "0.4";
    document.getElementById("playback").disabled = true;
    document.getElementById("timeoutBanner").style.display = "flex";
    document.getElementById("headerBar").style.marginTop = "40px";


    setTimeout(function waitPeriod() {
      document.getElementById("containerOne").style.display = "flex";
      startButton.disabled = false;
      startButton.style.cursor = "cursor";
      startButton.style.opacity = "1.0";
      document.getElementById("timeoutBanner").style.display = "none";

      document.cookie = "status=allowed,count=0";

      var cookiesArray = document.cookie.split(",");
      for (var i = 0; i < cookiesArray.length; i++) {
        var nameValueArray = cookiesArray[i].split("=");
        if (nameValueArray[0] == "count") {
          var ClickCount = parseInt(nameValueArray[1]);
        }
      }
      grecaptcha.reset();
    }, 600000); //Change to: 10 min. start-button timeout = 600000 in ms
  } else {
    //if(document.cookie.includes("allowed"))
    var cookiesArray = document.cookie.split(",");
    for (var i = 0; i < cookiesArray.length; i++) {
      var nameValueArray = cookiesArray[i].split("=");
      if (nameValueArray[0] == "count") {
        var ClickCount = parseInt(nameValueArray[1]);
      }
    }
  }
}

//Function which tracks for maximum of 20 transcription attempts before timing out user.
var ClickCount = 0;
let startButton = document.getElementById("start-capture-button");
let stopButton = document.getElementById("stop-capture-button");
document
  .getElementById("start-capture-button")
  .addEventListener("click", (e) => {

    //Automatic scrolling with transcript overflow.....keep it inside some function for better use
    setTimeout(function sizedUp() {
      if(document.getElementById("containerFour").style.display == "none"){
        setTimeout(sizedUp, 1000);
      }
      else if((document.getElementById("containerFour").style.display == "flex") && (document.getElementById("containerFive").style.display == "none")) {
        //console.log(" overflow scroll occurred ");
        document.getElementById("transcriptionContainer").scrollTo(0,document.getElementById("transcriptionContainer").scrollHeight);
        document.getElementById("transcriptionContainer").scroll({
          bottom: 0,
          left: 0,
          behavior: 'smooth'
        });
        setTimeout(sizedUp, 1000);
      }
      else{
        console.log("Vertical scrolling - Escaped overflow command");
      }
    },1000);

    //Check for undefined counts
    if (
      document.cookie.includes("undefined") ||
      document.cookie.includes("NaN") ||
      document.cookie == ""
    ) {
      var clickCount = 0;
      document.cookie = "status=allowed,count=0";
    }



    var clickLimit = 20; //Max number of clicks -- set to 20

    var cookiesArray = document.cookie.split(",");
    for (var i = 0; i < cookiesArray.length; i++) {
      var nameValueArray = cookiesArray[i].split("=");
      if (nameValueArray[0] == "count") {
        var ClickCount = parseInt(nameValueArray[1]);
      }
    }

    if (ClickCount >= clickLimit) {
      if (clickLimit == 1) {
        alert(
          "You can only attempt voice transcription " + clickLimit + " time."
        );
      } else {
        alert(
          "You can only attempt voice transcription " + clickLimit + " times."
        );
      }
      document.getElementById("containerTwo").style.display = "none";
      document.getElementById("containerOne").style.display = "flex";
      document.getElementById("containerOne").style.opacity = "1.0";
      document.getElementById("timeoutBanner").style.display = "flex";
      document.getElementById("headerBar").style.marginTop = "40px";

      startButton.disabled = true;
      startButton.style.cursor = "default";
      startButton.style.opacity = "0.4";
      startOfflineButton.disabled = true;
      startOfflineButton.style.cursor = "default";
      startOfflineButton.style.opacity = "0.4";
      document.getElementById("playback").disabled = true;


      document.cookie = "status=closed,count=" + ClickCount.toString();
      console.log("Value at Closing is : " + document.cookie);

      setTimeout(function waitPeriod() {
        var ClickCount = 0;
        grecaptcha.reset();
        document.getElementById("containerOne").style.display = "flex";
        startButton.disabled = false;
        startButton.style.cursor = "pointer";
        startButton.style.opacity = "1.0";
        startOfflineButton.disabled = false;
        startOfflineButton.style.cursor = "pointer";
        startOfflineButton.style.opacity = "1.0";
        document.getElementById("timeoutBanner").style.display = "none";
        document.getElementById("headerBar").style.marginTop = "0px";

        document.cookie = "status=allowed,count=0";
        location.reload();
      }, 600000); //Change to: 10 min. start-button timeout = 600000 in ms
    } else {
      ClickCount++;
      startButton.disabled = false;

      document.cookie = "status=allowed,count=" + ClickCount.toString();

      console.log("Current attempt number is now : " + ClickCount);
    }
  });

//Setting captcha reset and other events on clicking stop button
document
  .getElementById("stop-capture-button")
  .addEventListener("click", (e) => {

    if(document.getElementById("transcriptionResult").innerHTML.length>0){
      setTimeout(function playbackBufferTimeTwo() {
        document.getElementById("playback").disabled = false;
        document.getElementById("playback").style.opacity = "1.0";
        document.getElementById("playback").style.cursor = "pointer";
      }, 10000);
    }
//Hide container after stop click only when finalizing is done...so in polling function
    grecaptcha.reset();
  });


//Terms and Use checkbox listener..once checked make it disappear in cookie
var checkbox = document.querySelector("input[name=checkbox]");

checkbox.addEventListener("change", (e) => {
  if (document.getElementById("checkbox").checked && document.getElementById("checkboxContainer").style.display !=="none") {
    document.getElementById("start-capture-button").disabled = false;
    document.getElementById("start-capture-button").style.opacity = "1.0";
    document.getElementById("start-offlineTranscription-button").disabled = false;
    document.getElementById("start-offlineTranscription-button").style.opacity = "1.0";
    console.log("Terms and use checkbox is now checked...");
  } else if(!document.getElementById("checkbox").checked && document.getElementById("checkboxContainer").style.display !=="none"){
    console.log("Terms and use checkbox is not checked...");
    document.getElementById("start-capture-button").disabled = true;
    document.getElementById("start-capture-button").style.opacity = "8%";
    document.getElementById("start-offlineTranscription-button").disabled = true;
    document.getElementById("start-offlineTranscription-button").style.opacity = "8%";
  } else {
    console.log("Terms and use checkbox is not applicable right now...");
  }
});

//Reset captchaTwo
document
  .getElementById("startTranscribeButton")
  .addEventListener("click", (e) => {
    grecaptcha.reset(1);
  })


var startOfflineButton = document.getElementById("start-offlineTranscription-button");
//Set cookie counter for offline button and other events
document
.getElementById("start-offlineTranscription-button")
.addEventListener("click", (e) => {
  document.getElementById("containerOne").style.opacity = "0.4";
  document.getElementById("containerSix").style.display = "flex";//popup new modal
  document.getElementById("containerTwo").style.display = "none";
  document.getElementById("checkbox").disabled = true;
  document.getElementById("playback").disabled = true;
  document.getElementById("playback").style.opacity = "0.4";
  document.getElementById("playback").style.cursor = "default";

  //Check for undefined counts
  if (
    document.cookie.includes("undefined") ||
    document.cookie.includes("NaN") ||
    document.cookie == ""
  ) {
    var clickCount = 0;
    document.cookie = "status=allowed,count=0";
  }

  var clickLimit = 20; //Max number of clicks -- set to 20

  var cookiesArray = document.cookie.split(",");
  for (var i = 0; i < cookiesArray.length; i++) {
    var nameValueArray = cookiesArray[i].split("=");
    if (nameValueArray[0] == "count") {
      var ClickCount = parseInt(nameValueArray[1]);
    }
  }

  if (ClickCount >= clickLimit) {
    if (clickLimit == 1) {
      alert(
        "You can only attempt voice transcription " + clickLimit + " time."
      );
    } else {
      alert(
        "You can only attempt voice transcription " + clickLimit + " times."
      );
    }
    document.getElementById("containerTwo").style.display = "none";
    document.getElementById("containerOne").style.display = "flex";
    document.getElementById("containerOne").style.opacity = "1.0";
    document.getElementById("timeoutBanner").style.display = "flex";
    document.getElementById("headerBar").style.marginTop = "40px";
    document.getElementById("containerSix").style.display = "none";


    startButton.disabled = true;
    startButton.style.cursor = "default";
    startButton.style.opacity = "0.4";
    startOfflineButton.disabled = true;
    startOfflineButton.style.cursor = "default";
    startOfflineButton.style.opacity = "0.4";
    document.getElementById("playback").disabled = true;


    document.cookie = "status=closed,count=" + ClickCount.toString();
    console.log("Value at Closing is : " + document.cookie);

    setTimeout(function waitPeriod() {
      var ClickCount = 0;
      grecaptcha.reset();
      document.getElementById("containerOne").style.display = "flex";
      startButton.disabled = false;
      startButton.style.cursor = "pointer";
      startButton.style.opacity = "1.0";
      startOfflineButton.disabled = false;
      startOfflineButton.style.cursor = "pointer";
      startOfflineButton.style.opacity = "1.0";
      document.getElementById("timeoutBanner").style.display = "none";
      document.getElementById("headerBar").style.marginTop = "0px";

      document.cookie = "status=allowed,count=0";
      location.reload();
    }, 600000); //Change to: 10 min. start-button timeout = 600000 in ms
  } else {
    ClickCount++;
    startButton.disabled = false;

    document.cookie = "status=allowed,count=" + ClickCount.toString();

    console.log("Current attempt number is now : " + ClickCount);
  }
});