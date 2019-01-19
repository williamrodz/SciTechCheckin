var guestsByMember = {"Ali":["Jack","John","France"],"Ana":["Kat","Joe","Julia"]};

var sampleGuests = {'TestSchool':[{'LastName':'Rodorigesu','FirstName':'Uiriamu','School':'MIT','Committee':'UNSC','Delegation':'Yudonia'}
]};

var guestsByMemberWithState = {};
var defaultInitialGuestCount = 0;

var currentGuestCount = defaultInitialGuestCount;


function loadMemberListToAutoComplete(memberList){

	dataList = document.getElementById("memberList");
	console.log(dataList);
	for (var i=0; i<memberList.length; i++){
		console.log("adding");
		memberString = memberList[i];
		optionHTML = document.createElement("option");
		optionHTML.setAttribute("value",memberString);
		dataList.appendChild(optionHTML);	
	}

}

function checkInMembersGuest(member,guestname){
	console.log("member:",member);
	console.log("guestname:",guestname);

	membersGuests = guestsByMemberWithState[member];
	membersGuests[guestname].checkedin = true;
	incrementGuestCount();
}

function createGuestDataStructure(guestsDict){
	console.log(guestsDict);
	var members = Object.keys(guestsDict);
	for (var i =0; i <members.length; i++){
		member = members[i];
		membersGuests = guestsByMember[member];
		guestsWithStates = {};
		for (var j=0; j <membersGuests.length;j++){
			guest = membersGuests[j];
			guestsWithStates[guest] = {"name": guest, "checkedin" : false};
		}
		guestsByMemberWithState[member] = guestsWithStates;
	}
}


window.addEventListener('DOMContentLoaded', function(){
	createGuestDataStructure(guestsByMember);
	loadMemberListToAutoComplete(Object.keys(guestsByMember));
	document.getElementById('memberNameInput').addEventListener("keyup",
		function (event){

			var currentMemberInput = document.getElementById("memberNameInput").value;
			console.log(currentMemberInput);

			if (Object.keys(guestsByMember).includes(currentMemberInput)){
				console.log("YES");
				populateGuestsOfMember(currentMemberInput);
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


function createTable(guestsFromSchool){

	var grid = document.createElement("div");
	grid.setAttribute("id","guestTable");

	//create first row, with alphabet index
	//var alphabetString ='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var firstRow = document.createElement('div');
	firstRow.setAttribute("class","gridRow");
	var attributes = ['#','LastName','FirstName','School','Committee','Delegation'];
	var cols = attributes.length;
	for (var i=0; i<cols; i++){
		var cell = document.createElement('div');
		cell.setAttribute("class","gridCell");
		cell.setAttribute("id","indexCell")


		var text = attributes[i];
		var letterText = document.createTextNode(text)
		cell.appendChild(letterText);
		firstRow.appendChild(cell);

	}

	grid.appendChild(firstRow);

	var rows = guestsFromSchool.length
	//Everything after first row

	for (var i=0; i < rows; i++){
		var gridRow = document.createElement('div');
		gridRow.setAttribute("class","gridRow")

		//Add row index first
		var indexCell = document.createElement('div');
		indexCell.setAttribute("class","gridCell");		
		indexCell.setAttribute("id","indexCell");		
		var index = i+1;
		var indexText = document.createTextNode(index.toString());
		indexCell.appendChild(indexText);
		gridRow.appendChild(indexCell);

		//Add content cells
		var attributes = ['LastName','FirstName','School','Committee','Delegation'];

		for (var j=0; j<attributes.length; j++){
			var cellText = guestsFromSchool[i][attributes[j]];
			var cell = document.createElement('div');
			cell.innerHTML = cellText;


			//var cellID = "cellAtRow"+ i + "Col" + j;
			cell.setAttribute("id",'indexCell');
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
		console.log(guestHTML);

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


