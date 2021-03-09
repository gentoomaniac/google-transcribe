const WORD = 0;
const START_TIME = 1;
const END_TIME = 2;

var sound = $('#player');

var test_data;

var lineIndex = 0;
var lastWord = 0;

var transcriptFile;

var keyDown = false;

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
    $(document).on('keyup', function(e){
        switch(e.key){
            // ctrl + p for play/pause
            case 'p':
                if (e.altKey) {
                    if (sound.prop('paused'))
                        sound.trigger('play');
                    else
                        sound.trigger('pause');
                }
                break;
        }
    });
});

function updateWord(currentTime) {
    var index = getWordIndexByTime(currentTime)[0];

    $('#w_'+index).removeClass('badge-secondary');
    $('#w_'+index).addClass('badge-success');
    if (index != lastWord){
        $('#w_'+lastWord).removeClass('badge-success');
        $('#w_'+index).addClass('badge-secondary');
        lastWord = index;
    }
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

function setWordHandlers() {
    $('.word').attr('contenteditable','true');

    $('.word').on("dblclick", function(){
        sound.prop('currentTime', test_data.words[this.getAttribute("word-id")][START_TIME]);
    });
    $('.word').on("input", function(e){
        var element = $("#"+this.id);
        var wordId = parseInt(element.attr('word-id'));
        var rowId = parseInt(element.parent().attr('row-id'));

        // if a word is empty, remove it from the list of words
        if (element.text() == ''){
            test_data.words.splice(wordId, 1);
            test_data.transcript[rowId].end_word--;
            // empty row, remove row
            if (test_data.transcript[rowId].end_word - test_data.transcript[rowId].start_word < 0) {
                test_data.transcript.splice(rowId, 1);
            }
        } else {
            test_data.words[wordId][WORD] = element.text().replace('&ZeroWidthSpace;', '');
        }
        console.log(test_data.words[wordId][WORD])
    });
    $('.word').on("keydown", function(e){
        var element = $("#"+this.id);
        var row = element.parent()
        var caretPosition = getCaretPosition(this)[0];
        var wordId = parseInt(element.attr('word-id'));
        var rowId = parseInt(row.attr('row-id'));
        var word = test_data.words[wordId];
        console.log({'row': rowId, 'wordId': wordId, 'word': word, 'caretPosition': caretPosition})

        // ToDo: handle keys
        switch (e.key) {
            case " ":
                if (caretPosition == word[WORD].length) {
                    var newWord = ["&ZeroWidthSpace;", word[END_TIME], word[END_TIME]+0.1];
                    test_data.words.splice(wordId+1, 0, newWord);
                    test_data.transcript[rowId].end_word++;
                    if (rowId+1 < test_data.transcript.length)
                        test_data.transcript[rowId+1].start_word++;
                    var newRow = getTranscriptRow(test_data.transcript[rowId].start_word, test_data.transcript[rowId].end_word);
                    row.html(newRow.join(' '));
                    setWordHandlers();
                    $('#w_'+(wordId+1)).focus();
                }
                keyDown = false;
                console.log(test_data)
                return false;

            case "Enter":
                var newRow = {'confidence': 0, 'start_word': wordIndex+1, 'end_word': test_data.transcript[rowId].end_word}
                test_data.transcript[rowId].end_word = wordIndex;
                test_data.transcript.splice(rowId+1, 0, newRow);
                loadTranscript();
                return false;

            case "Tab":
                return false;

            // ToDo: consider curser position in the word
            case 'ArrowLeft':
            case 'ArrowRight':
                if (e.ctrlKey)
                    if (caretInWord == 0)
                        sound.prop('currentTime', word[START_TIME]);
                    else
                        sound.prop('currentTime', word[END_TIME]);
                break;
        }
        keyDown = false;
    });
}

function loadTranscript() {
    var html = genTranscriptHTML();

    var innerHTML;
    html.forEach(function(val, index) {
        innerHTML = innerHTML + '<p><div id="row_' + index + '" class="transcript-row transcript-row" row-id="' + index + '">' + val.join(' ') + '</div></p>';
    });
    $('#transcript').html(innerHTML);
    setWordHandlers();
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

function exportTranscript() {
    var text = "";
    loadTranscript();
    $('.transcript-row').each(function(){
        text += $("#"+this.id).text() + '\n';
    })
    download("transcript.txt", text);
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

function setCaret(element, position) {
    var rangeobj = document.createRange();
    var selectobj = window.getSelection();

    rangeobj.setStart(element, position);
    rangeobj.collapse(true);

    selectobj.removeAllRanges();

    selectobj.addRange(rangeobj);
}
