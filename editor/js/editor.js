const WORD = 0;
const START_TIME = 1;
const END_TIME = 2;

var sound = $('#player');

var test_data;

var lineIndex = 0;
var lastWords = [];

var transcriptFile;

$(document).ready(function(){
    $("#files").on("change", function(){
        console.log(this.value + ".json")
        $.getJSON("/" + this.value + ".json", function(json) {
            test_data = json;
            showTranscript();
        });
        sound.prop("src", "/" + this.value + ".mp3");
    });

    $('#add_word').click(addWord);
    sound.on("timeupdate", function(){
        updateWord(sound.prop("currentTime"));
    });
    sound.on("seeked", function(){
        var isPaused = sound.prop('paused');

        if (!isPaused)
            sound.trigger("pause");

        lastWords.push(getWordIndexByTime(sound.prop("currentTime"))[0]);
        updateWord();

        if (!isPaused)
            sound.trigger("play");
    });
});

function updateWord(currentTime) {
    // remove all but last word highlights
    if (lastWords.length > 5) {
        $('#w_'+lastWords[0]).removeClass('badge-success');
        $('#w_'+lastWords[0]).addClass('badge-secondary');
        lastWords.shift();
    }

    var index = getWordIndexByTime(currentTime)[0];
    if (index != lastWords[lastWords.length-1]){
        $('#w_'+index).removeClass('badge-secondary');
        $('#w_'+index).addClass('badge-success');
        lastWords.push(index);
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


function genTranscriptHTML() {
    var html = [];
    test_data.transcript.forEach(function(line){
        words = test_data.words.slice(line.start_word, line.end_word+1)

        var row = [];
        words.forEach(function(val, index){
            row.push('<span id="w_' + (line.start_word+index) + '" class="badge badge-secondary" onClick="editShow(' + (line.start_word+index) + ')\">' + val[WORD] + '</span>');
        });
        html.push(row);
    });
    return html;
}

function showTranscript() {
    var html = genTranscriptHTML();

    var innerHTML = "";
    html.forEach(function(val, index) {
        innerHTML = innerHTML + '<p id="row_' + index + '">' + val.join(' ') + '</p>';
    });
    $('#transcript').html(innerHTML);
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
