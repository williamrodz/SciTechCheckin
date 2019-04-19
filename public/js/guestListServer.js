// Initialize Firebase
// API credentials should be updated here

// To do every year:
// 1) Update config file below. Must have at least the lowest paid plan to have enough database queries for check in day
// 2) Delete delegates in database if any. Upload current year's guest CSV.
// 3) Update Master Assignments Sheet link in HTML 
// 4) Review and improve code

//--Left to do---
// 1) Synchrony between two open check in windows. 
//    You currently need to refresh the site to have the 
//    updates from another session to show up in check in count
// 2) settings being only available option with selfcheck in mode
// 3) password for settings

var config = {
  apiKey: "AIzaSyCuE1uw1toQDhgR0ccvV6QFBpm-1HwFYqM",
  authDomain: "scitechcheckin.firebaseapp.com",
  databaseURL: "https://scitechcheckin.firebaseio.com",
  projectId: "scitechcheckin",
  storageBucket: "scitechcheckin.appspot.com",
  messagingSenderId: "880455289287"
};
firebase.initializeApp(config);
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });


var guestsBySchool = {}; //local JS record of guests is stored here

var guestStates = {};
var defaultInitialGuestCount = 0;

var currentGuestCount = defaultInitialGuestCount;
var checkInMode = "SELFCHECKIN"; //"SELFCHECKIN" or "MASTER"
var additionalAttributes = []; //attributes other than School or Name 


// Takes any html element ID and add the hidden CSS class
function toggleHideHTMLElement(domID){
	var classList = document.getElementById(domID).classList;
	if (classList.contains('hiddenItem')){
		classList.remove('hiddenItem');
	} else{
		classList.add('hiddenItem');
	}
}

// Adds a school to the dropdown as an option HTML item
function addSchoolToAutoComplete(school){
	dataList = document.getElementById("schoolList");
	optionHTML = document.createElement("option");
	optionHTML.setAttribute("value",school);
	dataList.appendChild(optionHTML);		

}

// Loads all schools to school list
function loadSchoolListToAutoComplete(schoolList){

	dataList = document.getElementById("schoolList");
	for (var i=0; i<schoolList.length; i++){
		schoolString = schoolList[i];
		optionHTML = document.createElement("option");
		optionHTML.setAttribute("value",schoolString);
		dataList.appendChild(optionHTML);	
	}

}


function loadAttendeeToAutocomplete(attendeeDictionary){
	dataList = document.getElementById("attendeeList");
	optionHTML = document.createElement("option");
	optionHTML.classList.add("unselectedName");
	optionHTML.setAttribute("value",attendeeDictionary["Name"]);
	optionHTML.setAttribute("hash",createDictionaryHash(attendeeDictionary));
	dataList.appendChild(optionHTML);		

}

// Record in local guestStates dictionary and then change CSS if active
function checkInGuest(guestHash){
	console.log('went in ');
	// persist to Firebase
	db.collection("students").doc(guestHash).update({
	    'checkInStatus':true
	        })
		.then(function() {
		    console.log("Checked in guest on FB");
			guestStates[guestHash] = true;

			// if its CSS is active
			if (document.getElementById("row:"+guestHash)){
				var rowsClassList = document.getElementById("row:"+guestHash).classList;
				rowsClassList.add('checkedInRow');
			}			    
			syncGuestCount();
		})
		.catch(function(error) {
		    console.error("Error checking in guest on FB: ", error);
		});		

}

// Check out guest to firebase and then apply CSS logic
function checkOutGuest(guestHash){

	// persist to Firebase
	db.collection("students").doc(guestHash).update({
	    'checkInStatus':false
	        })
		.then(function() {
		    console.log("Checked out guest on FB");
			guestStates[guestHash] = false;

			// if CSS active
			if (document.getElementById("row:"+guestHash)){
				var rowsClassList = document.getElementById("row:"+guestHash).classList;
				if (rowsClassList.contains('checkedInRow')){
					rowsClassList.remove('checkedInRow');
				}			
			}
			syncGuestCount();
		})
		.catch(function(error) {
		    console.error("Error checking in guest on FB: ", error);
		});	


}

// Checks out ALL guests on the database.
// Only to be used for debugging purposes
// CAREFUL!: No way to recover check in status
// To do: add 'Are you sure option?' when this is called
function checkOutAllGuests(){
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        var guestHash = doc.id;
	        checkOutGuest(guestHash);
	    });	

	});
}

// Toggles check in status for use in check boxes 
function toggleGuestCheckIn(guestHash){
	guestStates[guestHash] = !guestStates[guestHash];
	var rowsClassList = document.getElementById("row:"+guestHash).classList;

	if (rowsClassList.contains('checkedInRow')){
		checkOutGuest(guestHash);
	} else{
		console.log("should check in guest");
		checkInGuest(guestHash);
	}
}


// Creates hash to be used for database and ID in HTML row for a particular guest
function createDictionaryHash(dictionary){
	// -- new method --
	var attributes = Object.keys(dictionary);
	attributes.sort();
	dictionaryHash = "";

	for (var i=0; i <attributes.length; i++){
		var attribute = attributes[i];
		dictionaryHash += attribute + "{"+dictionary[attribute]+"}";
	}

	// --- old method ---
	//dictionaryHash = 'Name{'+dictionary['Name']+'}School{'+dictionary['School']+'}Delegation{'+dictionary['Delegation']+'}Committee{'+dictionary['Committee']+'}checkInStatus{'+dictionary['Name']+'}';
	return dictionaryHash;

}

// Populates the 'guestStates' dictionary from an input guest dictionary, 
// setting everyone to checked-in false in the beginning
function createGuestDataStructure(guestsDict){
	var members = Object.keys(guestsDict);
	for (var i =0; i <members.length; i++){
		member = members[i];
		membersGuests = guestsDict[member];
		for (var j=0; j <membersGuests.length;j++){
			guest = membersGuests[j];
			guestHash = createDictionaryHash(guest);
			guestStates[guestHash] = false;
		}
	}
}


// Upload a single guest to the Firebase database from its guest dictionary
function uploadDataToFirebase(guestDict) {
  	var guestHash = createDictionaryHash(guestDict);

  	var attributes = Object.keys(guestDict);
  	for (var i=0; i <attributes.length; i++){
  		attribute = attributes[i];

		db.collection("students").doc(guestHash).set({
		    attribute: guestDict[attribute],
		        })
			.then(function() {
			    console.log("Document successfully written!");
			})
			.catch(function(error) {
			    console.error("Error writing document: ", error);
			});  		
  	}



}

// For debugging purposes
// Logs the list of students with their data in the console
function printListOfStudents(){
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        console.log(doc.id, " => ", doc.data());
	    });
	});	
}

globalAttendees = []
function loadAttendeeDataIntoGlobalArray(){
	var attendees = []
	var attendeesSoFar = 0
	var notFinished = true;
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        //console.log(doc.id, " => ", doc.data());
	        localAttendeeData = doc.data();
	        attendees.push(localAttendeeData);
	        globalAttendees.push(localAttendeeData);
	        attendeesSoFar += 1;
	        console.log("Processed",localAttendeeData);
	    });
	}).then( function(attendees){
		for (i = 0; i < globalAttendees.length; i++) { 
		  loadAttendeeToAutocomplete(globalAttendees[i]);
		}
	});
}

function getGlobalAttendeesNames(){
	names = []
	for (i = 0; i < globalAttendees.length; i++) { 
	  names.push(globalAttendees[i]["Name"]);
	}	
	return names;
}


// Careful! Exhausts Firebase daily queries limit in less than three minutes
// Was an attempt to keep guest check in status synced between two simultaneous sessions 
// Does not work 
function watchGuest(guestHash){
	var checkInstatusRef = db.ref('students/'+guestHash+'/checkInStatus');


	checkInstatusRef.on('value', function(snapshot) {
	 	//updateStarCount(postElement, snapshot.val());
	 	console.log(snapshot.val());
		var checkInStatus = doc.data()['checkInStatus'];
		if (checkInStatus){
			checkInGuest(guestHash);
		} else{
			checkOutGuest(guestHash);
		}	  
	});	
}

// For debugging purposes
function getCurrentGuestDictsFromFirebase(){
	var students = [];
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        var guestHash = doc.id;
	        var guestDict = doc.data();
	        var checkInStatus = guestDict['checkInStatus'];
	        var school = guestDict['School'];
	        //console.log('pushing');
	        students.push(guestDict);
	    });
	return students;
	});
}

function syncSettings(){
	// go through db
	db.collection("settings").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        var typeOfSettings = doc.id; //e.g customSettings
	        var settingsDictionary = doc.data();
	        var cloudCheckinMode = settingsDictionary["checkInMode"];
	        var cloudConferenceName = settingsDictionary["conferenceName"];
	       	var cloudNavBarColor = settingsDictionary["navBarColor"];

	       	checkInMode = cloudCheckinMode;
	       	setNavBarColor(cloudNavBarColor);
	    });
	}).then( function (something){
		hideSectionByClass("settingsSection");

		if (checkInMode == "SELFCHECKIN"){
			revealOnlySelfCheckIn();
		} else{
			revealOnlyMasterCheckIn();
		}			
	});	
}

// Sync guestStates from firebase database
function syncFromFirebase(){

// Get realtime updates with Cloud Firestore
// You can listen to a document with the onSnapshot() method. An initial call using the callback you provide creates a document snapshot immediately with the current contents of the single document. Then, each time the contents change, another call updates the document snapshot.
	syncSettings();
	// go through db
	gotAdditionalAttributes = false;
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        var guestHash = doc.id;
	        var guestDict = doc.data();
	        var checkInStatus = guestDict['checkInStatus'];
	        var school = guestDict['School'];

	        //verify additional attributes
	        if (gotAdditionalAttributes == false){
		        guestDictAttributes = Object.keys(guestDict);
		        for (var i=0 ; i <guestDictAttributes.length; i++){
		        	localAttribute = guestDictAttributes[i];
		        	if (localAttribute != "School" && localAttribute != "checkInStatus" 
		        		&& localAttribute !="Name"){
		        		additionalAttributes.push(localAttribute);
		        	}
		        }
		        gotAdditionalAttributes = true	        	
	        }


	        guestStates[guestHash] = checkInStatus;

			if (guestsBySchool[school]){
				guestsBySchool[school].push(guestDict);
			} else{
				guestsBySchool[school] = [guestDict];
				addSchoolToAutoComplete(school);

			}
			syncGuestCount();
	    });
	});
}


// Processes a CSV row of guests and uploads to FB database
// Ensure that row's columns match with data values
function processCSVDataRow(row,firstRowAttributes){
	//attributes = ['Name','School','Committee','Delegation'];

	// ----old method---
	// var school = row[0]
	// var committee = row[1]
	// var delegation = row[2]	
	// var name = row[3]

	// var newGuestDict = {'Name':name,"School":school,'Committee':committee, 'Delegation':delegation, 'checkInStatus':false};

	// ----new method----
	var newGuestDict = {};
	for (var i=0; i < firstRowAttributes.length; i++){
		attribute = firstRowAttributes[i];
		newGuestDict[attribute] = row[i];
	}
	uploadDataToFirebase(newGuestDict);

	if (guestsBySchool[school]){
		guestsBySchool[school].push(newGuestDict);
	} else{
		guestsBySchool[school] = [newGuestDict];
	}

}

// Loads guest data locally
function loadData(){
	createGuestDataStructure(guestsBySchool);
	loadSchoolListToAutoComplete(Object.keys(guestsBySchool));
	syncGuestCount();

}

// Allows user to upload a CSV to load to firebase
function UploadCSV() {
  var csvFileUpload = document.getElementById("csvFileUpload");
  var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
  if (regex.test(csvFileUpload.value.toLowerCase())) {
      if (typeof (FileReader) != "undefined") {
          var reader = new FileReader();
          reader.onload = function (e) {
              var table = document.createElement("table");
              var rows = e.target.result.split("\n");

              firstRow = rows[0];
              firstRowAttributes = firstRow.split(",");

              for (var i = 0; i < rows.length; i++) {
                  var row = table.insertRow(-1);
                  var cells = rows[i].split(",");
                  processCSVDataRow(cells,firstRowAttributes);
                  for (var j = 0; j < cells.length; j++) {
                      var cell = row.insertCell(-1);
                      cell.innerHTML = cells[j];
                  }
              }

	          loadData();              
          }

          reader.readAsText(csvFileUpload.files[0]);
      } else {
          alert("This browser does not support HTML5.");
      }
  } else {
      alert("Please upload a valid CSV file.");
  }
}


window.addEventListener('DOMContentLoaded', function(){
	loadAttendeeDataIntoGlobalArray();
	syncFromFirebase();

	document.getElementById('memberNameInput').addEventListener("keyup",
		function (event){

			var currentMemberInput = document.getElementById("memberNameInput").value;

			if (Object.keys(guestsBySchool).includes(currentMemberInput)){
				clearGuestList();
				createTable(currentMemberInput);
			} else{
				clearGuestList();
			}
			hideSectionByClass("settingsSection");
		});

	document.getElementById('selfCheckInNameInput').addEventListener("keyup",
		function (event){
			var currentAttendeeInput = document.getElementById("selfCheckInNameInput").value;
			console.log("pressed");
			if (getGlobalAttendeesNames().includes(currentAttendeeInput)){
				//enable Check-In Button
				enableCheckInButton();

			} else{
				disableCheckInButton();
			}

		});	
});


function enableCheckInButton(){
	document.getElementById("checkInButton").disabled = false;
	document.getElementById("checkInButton").setAttribute("class","btn btn-success");

}

function disableCheckInButton(){
	document.getElementById("checkInButton").disabled = true;
	document.getElementById("checkInButton").setAttribute("class","btn btn-default");

}

function clickCheckInButton(){

	var currentAttendeeInput = document.getElementById("selfCheckInNameInput").value;
	var optionList = document.getElementsByClassName("unselectedName");
	var guestHash = "";
	for (var i=0; i < optionList.length; i++){
		currentOption = optionList[i];
		if (currentOption.getAttribute("value") == currentAttendeeInput){
			guestHash = currentOption.getAttribute("hash");
			break;
		}
	}	
	if (guestHash != ""){
		checkInGuest(guestHash);
		$('#success_tic').modal('show');
	} 
}

// Exports CSV file 
function exportCSV(){
	exportRowsToCsv('MITMUNCCheckInData', getArrayOfRowData());
}


// Returns a row array of all attendees
function getArrayOfRowData(){	
	var columns = ['School','Committee','Delegation','checkInStatus'];

	var outputRows = [];
	outputRows.push(columns);
	let csvContent = "data:text/csv;charset=utf-8,";

	var schools = Object.keys(guestsBySchool);

	for (var i=0; i < schools.length;i++){
		var school = schools[i];
		var schoolStudents = (guestsBySchool[school]);
		if (school == 'CATS Academy Boston'){


		}
		for (var j=0; j < schoolStudents.length;j++){
			var rowArray = [];
			var student = schoolStudents[j];
			for (var k=0; k < columns.length; k++){
				var field = student[columns[k]];
				rowArray.push(field);
			}
			outputRows.push(rowArray);
			if (school == 'CATS Academy Boston'){
			}			
		}
	}
	return outputRows;
}

// Export array of rows to CSV with custom filename
function exportRowsToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}


// Sets the progress bar to the desired percentage
function setProgressBarPercent(percent){
	//round the percent first
	var roundedPercent = Math.round(percent);


	document.documentElement.style.setProperty('--progressBarWidth',roundedPercent+'%');
	var progressBarHTML = document.getElementById('progressBar');
	progressBarHTML.setAttribute('aria-valuenow',roundedPercent);
	progressBarHTML.innerHTML = roundedPercent+'%';
}

// Syncs the current guest count HTML item with the count in guestStates
function syncGuestCount(){
	var checkedInSoFar = 0;
	var notCheckedInSoFar = 0;
	var guestHashes = Object.keys(guestStates);
	for (i=0; i < guestHashes.length; i++){
		if (guestStates[guestHashes[i]]){
			checkedInSoFar++;
		} else{
			notCheckedInSoFar++;
		}
	}
	document.getElementById("currentGuestCount").innerHTML = checkedInSoFar;
	document.getElementById("currentNotArrivedYetCount").innerHTML = notCheckedInSoFar;

	//percent checked in
	var percentIn = checkedInSoFar/(checkedInSoFar+notCheckedInSoFar)*100;
	if (Number.isNaN(percentIn)){
		percentIn =0;
	}
	setProgressBarPercent(percentIn);

}

// Creates checkbox HTML item with desired ID, onchangefuntion and extra CSS class
function createCheckBox(checkboxID=null,onChangeFunction=null,extraClass=null){
		//add check in checkbox first
	var formCheck = document.createElement('div');
	formCheck.classList.add('form-check');
	// inner elements of form check
	var input = document.createElement('input');
	input.classList.add('form-check-input');
	input.setAttribute('type','checkbox');
	if (extraClass){
		input.classList.add(extraClass);
		//persist guest checkin on checkbox toggle
		if (extraClass == 'guestCheckBox'){
			var checkInStatus = guestStates[checkboxID];
			input.checked = checkInStatus;
		}
	}	
	if (checkboxID){
		input.setAttribute('id',checkboxID);
	}else{
		input.setAttribute('id','noID');
	}
	if (onChangeFunction){
		input.setAttribute('onchange',onChangeFunction);
	}

	var label = document.createElement('label');
	label.setAttribute('class','form-check-label');
	label.setAttribute('for','exampleCheck1');
	formCheck.appendChild(input);

	return formCheck;
}
// Applies logic when the 'select all' checkbox is clicked
function selectAllCheckBoxes(){
	var currentGuestCheckBoxes = document.getElementsByClassName('guestCheckBox');
	var currentSelectAllState = document.getElementById('selectAll').checked;
	var i =0;
	while (i <currentGuestCheckBoxes.length){
		// unchecked -> checked
		if (currentSelectAllState){
			var checkBox = currentGuestCheckBoxes[i];
			checkBox.checked = true;

			checkInGuest(checkBox.id);
			i++;			
		} else{
			var checkBox = currentGuestCheckBoxes[i];
			checkBox.checked = false;

			checkOutGuest(checkBox.id);
			i++;				
		}
	}

}

// Creates and populates the guest list table of a desired school
function createTable(targetSchool){

	var grid = document.createElement("div");
	grid.setAttribute("id","guestTable");

	var firstRow = document.createElement('div');
	firstRow.setAttribute("class","gridRow");
	var attributes = ['SelectAll','#','Name','School'];//'Committee','Delegation'];
	for (var i=0; i < additionalAttributes.length; i++){
		additionalAttribute = additionalAttributes[i];
		attributes.push(additionalAttribute);
	}
	var cols = attributes.length;
	for (var i=0; i<cols; i++){
		var cell = document.createElement('div');
		cell.setAttribute("class","gridCell");
		var attribute = attributes[i];
		if (attribute == 'SelectAll'){
			var child = createCheckBox('selectAll','selectAllCheckBoxes()');
			cell.classList.add('checkBoxCell');
		} else{
			var child = document.createTextNode(attribute)
		}
		cell.appendChild(child);
		firstRow.appendChild(cell);

	}

	grid.appendChild(firstRow);

	//Everything after first row
	// DO IT THROUGH FB
	// go through db
	var indexNumber = 1; 
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        var guestHash = doc.id;
	        var guestDict = doc.data();
	        var checkInStatus = guestDict['checkInStatus'];
	        var school = guestDict['School'];
	        // do logic

			var gridRow = document.createElement('div');
			gridRow.setAttribute("class","gridRow");
			gridRow.setAttribute('id','row:'+guestHash);


			// sync with other open browsers with same school
			//watchGuest(guestHash); <-- TBD

			// if row already exists or not target school, don't add
			if (targetSchool != school || document.getElementById('row:'+guestHash)){
				return;
			}

			// sync background color with check in status
			if (checkInStatus){
				gridRow.classList.add('checkedInRow');
			}
			gridRow.addEventListener("click", function (event){
				console.log(guestHash);
			});

			//add check in checkbox 
			var checkbox = createCheckBox(guestHash,"toggleGuestCheckIn('"+guestHash+"')",'guestCheckBox');

			var indexCell = document.createElement('div');
			indexCell.setAttribute("class","gridCell");	
			indexCell.classList.add('checkBoxCell');	
			indexCell.appendChild(checkbox);

			gridRow.appendChild(indexCell);		

			//Add row index second
			var indexCell = document.createElement('div');
			indexCell.setAttribute("class","gridCell");		
			var indexText = document.createTextNode(indexNumber.toString());
			indexCell.appendChild(indexText);
			gridRow.appendChild(indexCell);
			indexNumber++;

			//Add content cells
			var cellAttributes = ['CheckInStatus','Name','School'];//,'Committee','Delegation'];
			//additional attributes
			for (var i=0; i < additionalAttributes.length; i++){
				additionalAttribute = additionalAttributes[i];
				cellAttributes.push(additionalAttribute);
			}			

			for (var j=0; j<cellAttributes.length; j++){
				var attribute = cellAttributes[j]
				if (attribute == 'CheckInStatus'){
					continue;
				} else{
					var cellText = guestDict[attribute];
					var cell = document.createElement('div');
					cell.setAttribute('class','gridCell');
					cell.innerHTML = cellText;				
				}
				gridRow.appendChild(cell);
			}
			grid.appendChild(gridRow);	        
	    });
	});
	document.getElementById("guestList").appendChild(grid);
};

// Clears the guest list table
function clearGuestList(){
	document.getElementById("guestList").innerHTML = "";	

}

function hideSectionByClass(className){
	let root = document.documentElement;
	let cssDisplayVariable = "--"+className+"Display";
	root.style.setProperty(cssDisplayVariable, "none");	
}

function revealSectionByClass(className){
	let root = document.documentElement;
	let cssDisplayVariable = "--"+className+"Display";
	root.style.setProperty(cssDisplayVariable, "flex");	
}



function clickOnSettingsButton(){
	hideSectionByClass("checkInMonitor");
	hideSectionByClass("instructionsSection");
	hideSectionByClass("schoolNameSection");
	hideSectionByClass("attendeesSection");
	hideSectionByClass("selfCheckInSection");
	revealSectionByClass("settingsSection");

}

function revealOnlySelfCheckIn(){
	//navbar
	hideSectionByClass("uploadCSVNavItem");
	hideSectionByClass("masterSheetNavItem");
	hideSectionByClass("exportCSVNavItem");


	// sections
	hideSectionByClass("checkInMonitor");
	hideSectionByClass("instructionsSection");
	hideSectionByClass("schoolNameSection");
	hideSectionByClass("attendeesSection");
	revealSectionByClass("selfCheckInSection");	

}

function revealOnlyMasterCheckIn(){
	//navbar
	revealSectionByClass("uploadCSVNavItem");
	revealSectionByClass("masterSheetNavItem");
	revealSectionByClass("exportCSVNavItem");

	revealSectionByClass("checkInMonitor");
	revealSectionByClass("instructionsSection");
	revealSectionByClass("schoolNameSection");
	revealSectionByClass("attendeesSection");
	hideSectionByClass("selfCheckInSection");	

}

function escapeSettings(){
	if (checkInMode != "SELFCHECKIN"){
		revealOnlyMasterCheckIn();
	} else{
		revealOnlySelfCheckIn();
	}
	hideSectionByClass("settingsSection");

}


function setNavBarColor(color=null){
	if (color == null){
		var rawNavBarColorInput = document.getElementById("navBarColorInput").value;
	} else{
		var rawNavBarColorInput = color;
	}

	let root = document.documentElement;
	root.style.setProperty('--customNavBarColor', rawNavBarColorInput);

}

function saveSettingsButton(){

	var conferenceNameInput = document.getElementById("conferenceNameInput").value;

	var rawNavBarColorInput = document.getElementById("navBarColorInput").value;
	setNavBarColor(rawNavBarColorInput);


	var checkInModeDropDown = document.getElementById("checkInModeDropdown");
	var selectedCheckInMode = checkInModeDropDown.options[checkInModeDropDown.selectedIndex].value;
	if (selectedCheckInMode == "noneSelected"){
		selectedCheckInMode = checkInMode;
	}

	checkInMode = selectedCheckInMode;
	// persist to Firebase
	db.collection("settings").doc("customSettings").update({
	    'checkInMode':selectedCheckInMode,
	    'navBarColor':rawNavBarColorInput
	        })
		.then(function() {
			console.log("synced settings")
		})
		.catch(function(error) {
		    console.error("Error updating settings", error);
		});		

	escapeSettings();
}
