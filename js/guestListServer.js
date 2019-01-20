var guestsByMember = {"Ali":["Jack","John","France"],"Ana":["Kat","Joe","Julia"]};

var sampleSchools = {'TestSchool':[{'LastName':'Rodorigesu','FirstName':'Uiriamu','School':'MIT','Committee':'UNSC','Delegation':'Yudonia'}
,{'LastName':'Bunny','FirstName':'Bad','School':'Latin Trap','Committee':'PR','Delegation':'Mia'}]};

var guestStates = {};
var defaultInitialGuestCount = 0;

var currentGuestCount = defaultInitialGuestCount;


function loadSchoolListToAutoComplete(schoolList){

	dataList = document.getElementById("schoolList");
	for (var i=0; i<schoolList.length; i++){
		console.log("adding");
		schoolString = schoolList[i];
		optionHTML = document.createElement("option");
		optionHTML.setAttribute("value",schoolString);
		dataList.appendChild(optionHTML);	
	}

}

function checkInGuest(guestHash){
	console.log('checking in'+guestHash);
	guestStates[guestHash] = true;
	incrementGuestCount();
}

function deCheckInGuest(guestHash){
	guestStates[guestHash] = false;
	decrementGuestCount();
}

function toggleGuestCheckIn(guestHash){
	guestStates[guestHash] = !guestStates[guestHash];
	syncGuestCount();
}

function createDictionaryHash(dictionary){
	var keys = Object.keys(dictionary);
	var hash = '';
	for (var i =0; i <keys.length; i++){
		key = keys[i];
		val = dictionary[key];
		hash += key + "{" + val +"}";
	}
	return hash;

}

function createGuestDataStructure(guestsDict){
	console.log(guestsDict);
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


window.addEventListener('DOMContentLoaded', function(){
	createGuestDataStructure(sampleSchools);
	loadSchoolListToAutoComplete(Object.keys(sampleSchools));
	document.getElementById('memberNameInput').addEventListener("keyup",
		function (event){

			var currentMemberInput = document.getElementById("memberNameInput").value;
			console.log(currentMemberInput);

			if (Object.keys(sampleSchools).includes(currentMemberInput)){
				console.log("YES");
				clearGuestList();
				createTable(sampleSchools[currentMemberInput])
			}


			// if (event != null){
			// 	keyPressed = event.key;
			// 	if (keyPressed != null && keyPressed == "Enter"){
			// 		//extract input
			// 		var inputMemberName = document.getElementById('memberNameInput').value;
			// 		populateGuestsOfMember(inputMemberName);
			// 	}				
			// }

		});

});

function syncGuestCount(){
	var checkedInSoFar = 0;
	var guestHashes = Object.keys(guestStates);
	for (i=0; i < guestHashes.length; i++){
		if (guestStates[guestHashes[i]]){
			checkedInSoFar++;
		}
	}
	currentGuestCount = checkedInSoFar
	document.getElementById("currentGuestCount").innerHTML = currentGuestCount; 

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

function createCheckBox(checkboxID=null,onChangeFunction=null){
		//add check in checkbox first
	var formCheck = document.createElement('div');
	formCheck.classList.add('form-check');

	// inner elements of form check
	var input = document.createElement('input');
	input.classList.add('form-check-input');
	input.setAttribute('type','checkbox');
	if (checkboxID){
		input.setAttribute('id',checkboxID);
	}else{
		input.setAttribute('id','noID');
	}

	if (onChangeFunction){
		console.log(onChangeFunction);
		input.setAttribute('onchange',onChangeFunction);
	}


	var label = document.createElement('label');
	label.setAttribute('class','form-check-label');
	label.setAttribute('for','exampleCheck1');
	label.innerHTML = "Check";
	formCheck.appendChild(input);

	return formCheck;
}

function createTable(guestsFromSchool){

	var grid = document.createElement("div");
	grid.setAttribute("id","guestTable");

	//create first row, with alphabet index
	//var alphabetString ='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var firstRow = document.createElement('div');
	firstRow.setAttribute("class","gridRow");
	var attributes = ['SelectAll','#','LastName','FirstName','School','Committee','Delegation'];
	var cols = attributes.length;
	for (var i=0; i<cols; i++){
		var cell = document.createElement('div');
		cell.setAttribute("class","gridCell");


		var attribute = attributes[i];

		if (attribute == 'SelectAll'){
			var child = createCheckBox();
		} else{
			var child = document.createTextNode(attribute)
		}
		cell.appendChild(child);
		firstRow.appendChild(cell);

	}

	grid.appendChild(firstRow);

	var rows = guestsFromSchool.length
	//Everything after first row

	for (var i=0; i < rows; i++){
		var gridRow = document.createElement('div');
		gridRow.setAttribute("class","gridRow")

		//add check in checkbox first

		var guestHash = createDictionaryHash(guestsFromSchool[i]);
		var checkbox = createCheckBox(guestHash,"toggleGuestCheckIn('"+guestHash+"')");

		var indexCell = document.createElement('div');
		indexCell.setAttribute("class","gridCell");		
		indexCell.appendChild(checkbox);

		gridRow.appendChild(indexCell);		



		//Add row index second
		var indexCell = document.createElement('div');
		indexCell.setAttribute("class","gridCell");		
		var index = i+1;
		var indexText = document.createTextNode(index.toString());
		indexCell.appendChild(indexText);
		gridRow.appendChild(indexCell);

		//Add content cells
		var attributes = ['CheckInStatus','LastName','FirstName','School','Committee','Delegation'];

		for (var j=0; j<attributes.length; j++){
			var attribute = attributes[j]
			if (attribute == 'CheckInStatus'){
				continue;

			} else{
				var cellText = guestsFromSchool[i][attribute];
				var cell = document.createElement('div');
				cell.innerHTML = cellText;				

			}





			//var cellID = "cellAtRow"+ i + "Col" + j;
			gridRow.appendChild(cell);
		}
		grid.appendChild(gridRow);
	}
	document.getElementById("guestList").appendChild(grid);
};
function clearGuestList(){
	document.getElementById("guestList").innerHTML = "";	

}

function populateGuestsOfMember(member){
	clearGuestList();

	guests = Object.keys(guestsByMemberWithState[member]);
	for (var i =0; i <guests.length; i++){
		guestObject = guestsByMemberWithState[member][guests[i]];
		name = guestObject['name'];
		checkedin = guestObject['checkedin'];


		var guestHTML = document.createElement("a");
		var guestHTMLClass= "list-group-item list-group-item-action";
		guestHTML.setAttribute("class",guestHTMLClass);
		guestHTML.setAttribute("href","#");
		guestHTML.innerHTML = name;


		var buttonHTML = document.createElement("button");
		buttonHTML.setAttribute("type","button");
		buttonHTML.setAttribute("class","btn btn-primary checkInButton");

		buttonHTML.setAttribute("id","@:"+member+"#:"+name);

		buttonHTML.addEventListener("mouseup", function (event){
			buttonHTML = event.target;
			buttonIDString = buttonHTML.getAttribute("id");
			guestNameIndex = buttonIDString.indexOf("#:");
			memberName = buttonIDString.substring(2,guestNameIndex);
			guestName = buttonIDString.substring(guestNameIndex+2);
			console.log("-------out--------");
			console.log("memberName",memberName);
			console.log("guestName",guestName);			

			checkInMembersGuest(memberName,guestName);
			buttonHTML.classList.remove("btn-success");			
			buttonHTML.classList.add("disabled");
			buttonHTML.innerHTML = "Checked-in";

		});

		if (!checkedin){
			buttonHTML.classList.add("btn-success");
			buttonHTML.innerHTML = "Check-in";

		}
		else{
			buttonHTML.classList.add("disabled");
			buttonHTML.innerHTML = "Checked-in"

		}
		guestHTML.appendChild(buttonHTML);

		document.getElementById("guestList").appendChild(guestHTML);	
	}

}



function populateGuestList(){
	var guestHTML = document.createElement("a");
	var guestHTMLClass= "list-group-item list-group-item-action";
	guestHTML.setAttribute("class",guestHTMLClass);
	guestHTML.setAttribute("href","#");
	guestHTML.innerHTML = "Jenny Jin";


	var buttonHTML = document.createElement("button");
	buttonHTML.setAttribute("type","button");
	buttonHTML.setAttribute("class","btn btn-primary");
	buttonHTML.innerHTML = "Check-in";
	buttonHTML.addEventListener("mouseup", function(event){
		buttonHTML.classList.remove("btn-primary");
		buttonHTML.innerHTML = "Checked In";
		buttonHTML.classList.add("btn-success");
		buttonHTML.classList.add("disabled");

	},false);

	guestHTML.appendChild(buttonHTML);


	document.getElementById("guestList").appendChild(guestHTML);	

}


