const WORD = 0;
const START_TIME = 1;
const END_TIME = 2;

var sound;

var test_data;

var lineIndex = 0;
var wordIndex = 0;

$(document).ready(function(){
    $.getJSON("/short.json", function(json) {
        console.log(json); // this will show the info it in firebug console
        test_data = json;
        showTranscript();
    });

    $('#add_word').click(addWord);
    sound = $('#my-audio');
    sound.on("timeupdate", function(){
        updateWord(sound.prop("currentTime"));
    });
    sound.on("seeked", function(){
        var indexes = getWordIndexByTime(sound.prop("currentTime"));
        console.log(indexes);
        wordIndex = indexes[0];
    });
});

function updateWord(currentTime) {
    if (wordIndex+1 < test_data.words.length) {
        if (test_data.words[wordIndex + 1][START_TIME] <= currentTime)
            wordIndex++;

        var highlights = getWordIndexByTime(currentTime);
        $('#w_'+wordIndex).removeClass('badge-secondary');
        $('#w_'+wordIndex).addClass('badge-success');
        if (wordIndex>0) {
            $('#w_'+(wordIndex-1)).removeClass('badge-success');
            $('#w_'+(wordIndex-1)).addClass('badge-secondary');
            }
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
    test_data.words[wordIndex][WORD] = $('#word').val();
    test_data.words[wordIndex][START_TIME] = $('#start-time').val();
    test_data.words[wordIndex][END_TIME] = $('#end-time').val();
    $('.edit-word').hide();
    var wordId = $('#word-id').val();
    $('#w_'+wordId).text(test_data.words[wordIndex][WORD])
    updateWord();

}

function addWord() {
    var newWord = window.prompt("add new word:", "");
    test_data.words.splice(wordIndex+1, 0, {'word': newWord, 'start_time': sound.currentTime, 'end_time': null});
    updateWord();
}


function gentranscriptHTML() {
    var html = [];
    test_data.transcript.forEach(function(line){
        words = test_data.words.slice(line.start_word, line.end_word+1)

        var row = [];
        words.forEach(function(val, index){
            row.push("<span id=\"w_" + index + "\" class=\"badge badge-secondary\" onClick=\"editShow(" + index + ")\">" + val[WORD] + "</span>");
        });
        html.push(row);
    });
    return html;
}

function showTranscript() {
    var html = gentranscriptHTML();

    var innerHTML = "";
    html.forEach(function(val) {
        innerHTML = innerHTML + '<p>' + val.join(' ') + '</p>';
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
