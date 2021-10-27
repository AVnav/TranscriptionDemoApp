//Default onLoad browser page states
function defaultUploadFileState() {
  document.getElementById("containerSix").style.display = "none"; //Change to none!
  document.getElementById("containerSeven").style.display = "none";
  document.getElementById("containerEight").style.display = "none";
  document.getElementById("startTranscribeButton").disabled = true;
  document.getElementById("startTranscribeButton").style.opacity = "0.4";
  document.getElementById("startTranscribeButton").style.cursor = "default";
  document.getElementById("playbackTwo").disabled = true;
  document.getElementById("playbackTwo").style.opacity = "0.4";
  document.getElementById("playbackTwo").style.cursor = "default";

  if (document.cookie.includes("count=0") || document.cookie.includes("NaN")) {
    document.getElementById(
      "start-offlineTranscription-button"
    ).disabled = true;
    document.getElementById("start-offlineTranscription-button").style.opacity =
      "8%";
  } else {
    setTimeout(function runUploadButton() {
      if (document.getElementById("start-capture-button").disabled == true) {
        setTimeout(runUploadButton, 500);
      } else {
        //console.log("Upload limits loaded");
        document.getElementById(
          "start-offlineTranscription-button"
        ).disabled = false;
        document.getElementById(
          "start-offlineTranscription-button"
        ).style.opacity = "1.0";
      }
    }, 500);
  }
}
window.onLoad = defaultUploadFileState();

//Logic for File Upload
function id(id) {
  return document.getElementById(id);
}

// call initialization file
if (window.File && window.FileList && window.FileReader) {
  Init();
}

//
// initialize
function Init() {
  var fileselect = id("fileselect"),
    filedrag = id("filedrag");
  //submitbutton = id("submitbutton");

  // file select
  fileselect.addEventListener("change", FileSelectHandler, false);

  // is XHR2 available?
  var xhr = new XMLHttpRequest();
  if (xhr.upload) {
    // file drop
    filedrag.addEventListener("dragover", FileDragHover, false);
    filedrag.addEventListener("dragleave", FileDragHover, false);
    filedrag.addEventListener("drop", FileSelectHandlerTwo, false);
    filedrag.style.display = "block";
  }
}

//File drag leave
function FileSelectHandlerTwo(e) {
  // cancel event and hover styling
  FileDragHover(e);

  // fetch FileList object
  var filesDrag = e.target.files || e.dataTransfer.files;

  const dt = e.dataTransfer;
  const files = dt.files;
  document.getElementById("fileselect").files = files;
  console.log(document.getElementById("fileselect").files);
  // process all File objects
  for (var i = 0, f; (f = filesDrag[i]); i++) {
    ParseFile(f);
  }
}

// file drag hover
function FileDragHover(e) {
  e.stopPropagation();
  e.preventDefault();
  e.target.className = e.type == "dragover" ? "hover" : "";
}

// File selection
function FileSelectHandler(e) {
  // cancel event and hover styling
  FileDragHover(e);

  // fetch FileList object
  var files = e.target.files || e.dataTransfer.files;
  console.log(files);

  // process all File objects
  for (var i = 0, f; (f = files[i]); i++) {
    ParseFile(f);
  }
}

function ParseFile(file) {
  //128 MB= 134217728 Bytes
  //15MB = 1.5e+7 Bytres
  if (
    file.size <= 1.5e7 &&
    (file.type.includes("audio/wav") ||
      file.type.includes("audio/flac"))
  ) {
    document.getElementById("fileInfoMessages").innerHTML =
      "&nbsp" +
      file.name +
      " ( Type: " +
      file.type +
      ", Size: " +
      file.size / 1000000 +
      " MB )";

    //Shift to file display - semi screen
    fileDisplay(file);
  } else if (file.size <= 1.5e7) {
    document.getElementById("fileInfoMessages").innerHTML =
      "&nbsp" + "This file type is not allowed";

    //Shift to try again - type limit
    fileTryAgainType(file);
  } else {
    //Error message -- file is too big
    document.getElementById("fileInfoMessages").innerHTML =
      "&nbsp" + "Your File exceeds the maximum file size(15MB) allowed";

    //Shift to try again - size limit
    fileTryAgainSize(file);
  }
}

//When browse clicked open file select
document.getElementById("underlineBrowse").addEventListener("click", (e) => {
  document.getElementById("fileselect").click();
});

function fileDisplay(file) {
  document.getElementById("importBox").style.display = "none";
  document.getElementById("deleteFileZone").style.display = "flex";
  document.getElementById("fileIconName").innerHTML = file.name;
}

function fileTryAgainSize(file) {
  document.getElementById("importBox").style.display = "none";
  document.getElementById("reCaptchaTwo").style.display = "none";
  document.getElementById("startTranscribeButton").style.display = "none";
  document.getElementById("wrongFileZone").style.display = "flex";
  document.getElementById("fileIconNameTwo").innerHTML = file.name;
  document.getElementById("errorBoxText").innerHTML = "Allowed file size exceeded and your file could not be<br>uploaded. Please try again!";

}

function fileTryAgainType(file) {
  document.getElementById("importBox").style.display = "none";
  document.getElementById("wrongFileZone").style.display = "flex";
  document.getElementById("fileIconNameTwo").innerHTML = file.name;
  document.getElementById("errorBoxText").innerHTML = "File type not allowed and your file could not be<br>uploaded. Please try again!";

}

// Event for try again button
document
  .getElementById("tryAgainButton")
  .addEventListener("click", (e) => {
    document.getElementById("wrongFileZone").style.display = "none";
    document.getElementById("reCaptchaTwo").style.display = "flex";
    document.getElementById("startTranscribeButton").style.display = "flex";
    document.getElementById("importBox").style.display = "flex";
  })

// Event for delete file button
document
  .getElementById("deleteStagedFile")
  .addEventListener("click", (e) => {
    document.getElementById("deleteFileZone").style.display = "none";
    document.getElementById("importBox").style.display = "flex";

    if(document.getElementById("startTranscribeButton").disabled==false){
      grecaptcha.reset(1);
    }

    document.getElementById("startTranscribeButton").disabled = true;
    document.getElementById("startTranscribeButton").style.opacity = "0.4";
    document.getElementById("startTranscribeButton").style.cursor = "default";

    // Clear files file upload storage
    document.getElementById('fileselect').value = "";
    document.getElementById("fileInfoMessages").innerHTML = "";
  })