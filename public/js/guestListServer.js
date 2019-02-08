// Initialize Firebase
var config = {
  apiKey: "AIzaSyCuE1uw1toQDhgR0ccvV6QFBpm-1HwFYqM",
  authDomain: "mitmunc-checkin.firebaseapp.com",
  databaseURL: "https://mitmunc-checkin.firebaseio.com",
  projectId: "mitmunc-checkin",
  storageBucket: "mitmunc-checkin.appspot.com",
  messagingSenderId: "355923752781"
};
firebase.initializeApp(config);



const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });




// var guestsByMember = {"Ali":["Jack","John","France"],"Ana":["Kat","Joe","Julia"]};

// var sampleSchools = {'TestSchool':[{'Name':'Rodorigesu','FirstName':'Uiriamu','School':'MIT','Committee':'UNSC','Delegation':'Yudonia'}
// ,{'Name':'Bunny','FirstName':'Bad','School':'Latin Trap','Committee':'PR','Delegation':'Mia'},
// {'Name':'Banana','FirstName':'Guineo','School':'Banano','Committee':'Potasium','Delegation':'K'}],
// "TestSchool2":
// [{'Name':'gato','FirstName':'miau','School':'fish','Committee':'tips','Delegation':'Yudonia'}
// ,{'Name':'Bunny','FirstName':'Benito','School':'Latin Trap 2','Committee':'h','Delegation':'tuya'},
// {'Name':'toddyno','FirstName':'anitta','School':'moffin','Committee':'tastee','Delegation':'wow'}]};

// for (var i =0; i < Object.keys(sampleSchools).length; i++){
// 	var school = Object.keys(sampleSchools)[i];
// 	for (var j =0; j < (sampleSchools[school]).length; j++){
// 		student = sampleSchools[school][j];
// 		student['CheckInStatus'] = false;
// 	}
// }

var guestsBySchool = {};




var guestStates = {};
var defaultInitialGuestCount = 0;

var currentGuestCount = defaultInitialGuestCount;


function addSchoolToAutoComplete(school){
	dataList = document.getElementById("schoolList");
	optionHTML = document.createElement("option");
	optionHTML.setAttribute("value",school);
	dataList.appendChild(optionHTML);		

}

function loadSchoolListToAutoComplete(schoolList){

	dataList = document.getElementById("schoolList");
	for (var i=0; i<schoolList.length; i++){
		schoolString = schoolList[i];
		optionHTML = document.createElement("option");
		optionHTML.setAttribute("value",schoolString);
		dataList.appendChild(optionHTML);	
	}

}

function getDBStateOfGuest(guestHash){
	firebase.database().ref('/students/' + guestHash).once('value').then(function(snapshot) {
  	var data = (snapshot.val() && snapshot.val().checkInStatus) || 'Anonymous';
  	return data;
	});
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

function checkOutAllGuests(){
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        var guestHash = doc.id;
	        //console.log('pushing');
	        checkOutGuest(guestHash);
	    });	

	});
}

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

function createDictionaryHash(dictionary){

	dictionaryHash = 'Name{'+dictionary['Name']+'}School{'+dictionary['School']+'}Delegation{'+dictionary['Delegation']+'}Committee{'+dictionary['Committee']+'}checkInStatus{'+dictionary['Name']+'}';
	return dictionaryHash;

}





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

function uploadDataToFirebase(guestDict) {
  	var guestHash = createDictionaryHash(guestDict);

	db.collection("students").doc(guestHash).set({
	    'Name': guestDict['Name'],
	    'School': guestDict['School'],
	    'Committee': guestDict['Committee'],
	    'Delegation' : guestDict['Delegation'],
	    'checkInStatus':guestDict['checkInStatus']
	        })
		.then(function() {
		    console.log("Document successfully written!");
		})
		.catch(function(error) {
		    console.error("Error writing document: ", error);
		});


}

function getListOfStudents(){
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        console.log(doc.id, " => ", doc.data());
	    });
	});	

}




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

    // .onSnapshot(function(doc) {
    //     // console.log("Current data: ", doc.data());
    //     var checkInStatus = doc.data()['checkInStatus'];
    //     if (checkInStatus){
    //     	checkInGuest(guestHash);
    //     } else{
    //     	checkOutGuest(guestHash);
    //     }
        
    // });
}

// all students are in guestsBySchool
// all states are in guestStates


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

function syncFromFirebase(){

// Get realtime updates with Cloud Firestore
// You can listen to a document with the onSnapshot() method. An initial call using the callback you provide creates a document snapshot immediately with the current contents of the single document. Then, each time the contents change, another call updates the document snapshot.
	
	// go through db
	db.collection("students").get().then(function(querySnapshot) {
	    querySnapshot.forEach(function(doc) {
	        // doc.data() is never undefined for query doc snapshots
	        var guestHash = doc.id;
	        var guestDict = doc.data();
	        var checkInStatus = guestDict['checkInStatus'];
	        var school = guestDict['School'];

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



function processCSVDataRow(row){
	//attributes = ['Name','School','Committee','Delegation'];
	var school = row[0]
	var committee = row[1]
	var delegation = row[2]	
	var name = row[3]

	var newGuestDict = {'Name':name,"School":school,'Committee':committee, 'Delegation':delegation, 'checkInStatus':false};

	uploadDataToFirebase(newGuestDict);

	if (guestsBySchool[school]){
		guestsBySchool[school].push(newGuestDict);
	} else{
		guestsBySchool[school] = [newGuestDict];
	}

}

function loadData(){
	createGuestDataStructure(guestsBySchool);
	loadSchoolListToAutoComplete(Object.keys(guestsBySchool));
	syncGuestCount();

}


function UploadCSV() {
  var csvFileUpload = document.getElementById("csvFileUpload");
  var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
  if (regex.test(csvFileUpload.value.toLowerCase())) {
      if (typeof (FileReader) != "undefined") {
          var reader = new FileReader();
          reader.onload = function (e) {
              var table = document.createElement("table");
              var rows = e.target.result.split("\n");
              for (var i = 0; i < rows.length; i++) {
                  var row = table.insertRow(-1);
                  var cells = rows[i].split(",");
                  processCSVDataRow(cells);
                  for (var j = 0; j < cells.length; j++) {
                      var cell = row.insertCell(-1);
                      cell.innerHTML = cells[j];
                  }
              }
              // var dvTable = document.getElementById("dvTable");
              // dvTable.innerHTML = "";
              // dvTable.appendChild(table);
	          console.log('Before load');
	          console.log((guestsBySchool));
	          console.log('After');
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

	//loadData();
	syncFromFirebase();
	document.getElementById('memberNameInput').addEventListener("keyup",
		function (event){

			var currentMemberInput = document.getElementById("memberNameInput").value;

			if (Object.keys(guestsBySchool).includes(currentMemberInput)){
				clearGuestList();
				createTable(currentMemberInput);
			}

		});

});

function setProgressBarPercent(percent){
	//round the percent first
	var roundedPercent = Math.round(percent);


	document.documentElement.style.setProperty('--progressBarWidth',roundedPercent+'%');
	var progressBarHTML = document.getElementById('progressBar');
	progressBarHTML.setAttribute('aria-valuenow',roundedPercent);
	progressBarHTML.innerHTML = roundedPercent+'%';
}

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


function incrementGuestCount(){
	currentGuestCount++;
	document.getElementById("currentGuestCount").innerHTML = currentGuestCount; 
}

function decrementGuestCount(){
	if (currentGuestCount != 0){
		currentGuestCount--;
		document.getElementById("currentGuestCount").innerHTML = currentGuestCount; 
	}
}

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

function selectAllCheckBoxes(){
	var currentGuestCheckBoxes = document.getElementsByClassName('guestCheckBox');
	var currentSelectAllState = document.getElementById('selectAll').checked;
	console.log(currentSelectAllState);
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




function createTable(targetSchool){

	var grid = document.createElement("div");
	grid.setAttribute("id","guestTable");

	//create first row, with alphabet index
	//var alphabetString ='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var firstRow = document.createElement('div');
	firstRow.setAttribute("class","gridRow");
	var attributes = ['SelectAll','#','Name','School','Committee','Delegation'];
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
			//watchGuest(guestHash);

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
			var attributes = ['CheckInStatus','Name','School','Committee','Delegation'];

			for (var j=0; j<attributes.length; j++){
				var attribute = attributes[j]
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
function clearGuestList(){
	document.getElementById("guestList").innerHTML = "";	

}

// function populateGuestsOfMember(member){
// 	clearGuestList();
// 	console.log('here');

// 	guests = Object.keys(guestsByMemberWithState[member]);
// 	for (var i =0; i <guests.length; i++){
// 		guestObject = guestsByMemberWithState[member][guests[i]];
// 		name = guestObject['name'];
// 		checkedin = guestObject['checkedin'];


// 		var guestHTML = document.createElement("a");
// 		var guestHTMLClass= "list-group-item list-group-item-action";
// 		guestHTML.setAttribute("class",guestHTMLClass);
// 		guestHTML.setAttribute("href","#");
// 		guestHTML.innerHTML = name;


// 		var buttonHTML = document.createElement("button");
// 		buttonHTML.setAttribute("type","button");
// 		buttonHTML.setAttribute("class","btn btn-primary checkInButton");

// 		buttonHTML.setAttribute("id","@:"+member+"#:"+name);

// 		buttonHTML.addEventListener("mouseup", function (event){
// 			buttonHTML = event.target;
// 			buttonIDString = buttonHTML.getAttribute("id");
// 			guestNameIndex = buttonIDString.indexOf("#:");
// 			memberName = buttonIDString.substring(2,guestNameIndex);
// 			guestName = buttonIDString.substring(guestNameIndex+2);
		

// 			checkInMembersGuest(memberName,guestName);
// 			buttonHTML.classList.remove("btn-success");			
// 			buttonHTML.classList.add("disabled");
// 			buttonHTML.innerHTML = "Checked-in";

// 		});

// 		if (!checkedin){
// 			buttonHTML.classList.add("btn-success");
// 			buttonHTML.innerHTML = "Check-in";

// 		}
// 		else{
// 			buttonHTML.classList.add("disabled");
// 			buttonHTML.innerHTML = "Checked-in"

// 		}
// 		guestHTML.appendChild(buttonHTML);

// 		document.getElementById("guestList").appendChild(guestHTML);	
// 	}

// }



// function populateGuestList(){
// 	var guestHTML = document.createElement("a");
// 	var guestHTMLClass= "list-group-item list-group-item-action";
// 	guestHTML.setAttribute("class",guestHTMLClass);
// 	guestHTML.setAttribute("href","#");
// 	guestHTML.innerHTML = "Jenny Jin";


// 	var buttonHTML = document.createElement("button");
// 	buttonHTML.setAttribute("type","button");
// 	buttonHTML.setAttribute("class","btn btn-primary");
// 	buttonHTML.innerHTML = "Check-in";
// 	buttonHTML.addEventListener("mouseup", function(event){
// 		buttonHTML.classList.remove("btn-primary");
// 		buttonHTML.innerHTML = "Checked In";
// 		buttonHTML.classList.add("btn-success");
// 		buttonHTML.classList.add("disabled");

// 	},false);

// 	guestHTML.appendChild(buttonHTML);


// 	document.getElementById("guestList").appendChild(guestHTML);	

// }


