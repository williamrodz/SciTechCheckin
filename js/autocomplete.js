alphabet = "abcdefghijklmnopqrstuvwxyz ";


corpus = ["Javier","Jack","Joe"];



var getOneWordEdits = function (word){

	if (word.length < 2){
		return [];
	}

	output = [];

	for (var i =0 ; i <alphabet.length;i++){
		letter = alphabet.substring(i,i+1);

		for (var j =0; j < word.length - 1; j++){
			leftSide = word.substring(0,j);
			rightSide = word.substring(j+1);

			oneWordEdit = leftSide + letter + rightSide;
			output.push(oneWordEdit);
		}
	}
	return output;
}

var getSuggestions = function(textSoFar){

	var suggestions = [];

	var preFixesToConsider = getOneWordEdits(textSoFar);
	preFixesToConsider.push(textSoFar);

	for (var i=0; i <corpus.length; i++){
		word = corpus[i];
		for (var j=0; j< preFixesToConsider.length; j++){

			var prefix = preFixesToConsider[j];
			prefix = prefix.toLowerCase();

			if (word.toLowerCase().indexOf(prefix) != -1 && !suggestions.includes(word)){
				suggestions.push(word);
			}
	}	


	
	}

	return suggestions;


}