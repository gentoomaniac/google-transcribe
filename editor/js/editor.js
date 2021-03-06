const WORD = 0;
const START_TIME = 1;
const END_TIME = 2;

var sound = $('#player');

var test_data;

var lineIndex = 0;
var lastWord = 0;

var transcriptFile;

$(document).ready(function(){
    $("#files").on("change", function(){
        $.getJSON("/" + this.value + ".json", function(data) {
            test_data = data;
            loadTranscript();
        });
        sound.prop("src", "/" + this.value + ".mp3");
    });

    sound.on("timeupdate", function(){
        updateWord(sound.prop("currentTime"));
    });
    sound.on("seeked", function(){
        var isPaused = sound.prop('paused');

        if (!isPaused)
            sound.trigger("pause");

        lastWord = getWordIndexByTime(sound.prop("currentTime"))[0];
        updateWord();

        if (!isPaused)
            sound.trigger("play");
    });
});

function updateWord(currentTime) {
    var index = getWordIndexByTime(currentTime)[0];

    $('#w_'+index).removeClass('badge-secondary');
    $('#w_'+index).addClass('badge-success');
    if (index != lastWord){
        $('#w_'+lastWord).removeClass('badge-success');
        $('#w_'+lastWord).addClass('badge-secondary');
        lastWord = index;
    }
}


function editShow(index) {
    $('#word').val(test_data.words[index][WORD]);
    $('#start-time').val(test_data.words[index][START_TIME]);
    $('#end-time').val(test_data.words[index][END_TIME]);
    $('#word-id').val(index);
    $('.edit-word').show();
}

function editClose() {
    $('.edit-word').hide();
}

function saveWord() {
    var lastIndex = lastWords.length-1;
    test_data.words[lastWords[lastIndex]][WORD] = $('#word').val();
    test_data.words[lastWords[lastIndex]][START_TIME] = $('#start-time').val();
    test_data.words[lastWords[lastIndex]][END_TIME] = $('#end-time').val();
    $('.edit-word').hide();
    var wordId = $('#word-id').val();
    $('#w_'+wordId).text(test_data.words[lastWords[lastIndex]][WORD])
    updateWord();

}

function addWord() {
    var newWord = window.prompt("add new word:", "");
    test_data.words.splice(lastWord+1, 0, {'word': newWord, 'start_time': sound.currentTime, 'end_time': null});
    updateWord();
}

function getTranscriptRow(start, end) {
    words = test_data.words.slice(start, end);
    var row = [];
    words.forEach(function(val, index){
        row.push('<span id="w_' + (start+index) + '" class="badge badge-secondary word" word-id="' + (start+index) + '">' + val[WORD] + '</span>');
    });
    return row;
}

function genTranscriptHTML() {
    var html = [];
    test_data.transcript.forEach(function(line){
        html.push(getTranscriptRow(line.start_word, line.end_word+1));
    });
    return html;
}

function loadTranscript() {
    var html = genTranscriptHTML();

    var innerHTML = "";
    html.forEach(function(val, index) {
        innerHTML = innerHTML + '<div id="row_' + index + '" class="transcript-row" row-id="' + index + '" contenteditable="true"><p>' + val.join(' ') + '</p></div>';
    });
    $('#transcript').html(innerHTML);
    $('.transcript-row').on("keydown", function(e){
        // ToDo: handle keys
        switch (e.key) {
            case " ":
            case "Tab":
            case "Enter":
                return false;
        }
    });
    $('.transcript-row').on("input", function(){
        var element = $("#"+this.id);
        var tags = element.text().split(' ')
        var tagIndex = element.text().slice(0, getCaretPosition(this)[0]).split(' ').length-1;
        var wordIndex = test_data.transcript[element.attr("row-id")].start_word + tagIndex
        test_data.words[wordIndex][WORD] = tags[tagIndex];
    });
}

function getWordIndexByTime(currentTime) {
    var result = []
    test_data.words.forEach(function(val, index){
        if (val[END_TIME] >= currentTime && val[START_TIME] <= currentTime) {
            result.push(index);
        }
    });

    return result
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

function exportJson() {
    download("transcript.json", JSON.stringify(test_data))
}


///// https://stackoverflow.com/a/53128599

// node_walk: walk the element tree, stop when func(node) returns false
function node_walk(node, func) {
var result = func(node);
for(node = node.firstChild; result !== false && node; node = node.nextSibling)
    result = node_walk(node, func);
return result;
};

// getCaretPosition: return [start, end] as offsets to elem.textContent that
//   correspond to the selected portion of text
//   (if start == end, caret is at given position and no text is selected)
function getCaretPosition(elem) {
var sel = window.getSelection();
var cum_length = [0, 0];

    if(sel.anchorNode == elem)
        cum_length = [sel.anchorOffset, sel.extentOffset];
    else {
        var nodes_to_find = [sel.anchorNode, sel.extentNode];
        if(!elem.contains(sel.anchorNode) || !elem.contains(sel.extentNode))
            return undefined;
        else {
            var found = [0,0];
        var i;
        node_walk(elem, function(node) {
            for(i = 0; i < 2; i++) {
            if(node == nodes_to_find[i]) {
                found[i] = true;
                if(found[i == 0 ? 1 : 0])
                    return false; // all done
            }
            }

            if(node.textContent && !node.firstChild) {
            for(i = 0; i < 2; i++) {
                if(!found[i])
                    cum_length[i] += node.textContent.length;
            }
            }
        });
        cum_length[0] += sel.anchorOffset;
        cum_length[1] += sel.extentOffset;
        }
    }
    if(cum_length[0] <= cum_length[1])
        return cum_length;
    return [cum_length[1], cum_length[0]];
}
