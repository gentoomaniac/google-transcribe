const WORD = 0;
const START_TIME = 1;
const END_TIME = 2;

const sound = new Audio();
var test_data;


$('#play').click(playSound);
$('#stop').click(stop);
$('#add_word').click(addWord);

$.getJSON("/short.json", function(json) {
    console.log(json); // this will show the info it in firebug console
    test_data = json;
});

var lineIndex = 0;
var wordIndex = 0;

function updateTranscript() {
    if (lineIndex+1 < test_data.transcript.length) {
        if (test_data.transcript[lineIndex +1][START_TIME] <= sound.currentTime)
            lineIndex++;

        if (test_data.transcript[lineIndex][START_TIME] < sound.currentTime)
            $("#transcript").html(test_data.transcript[lineIndex].text);
    }

}
function updateWord() {
    if (wordIndex+1 < test_data.words.length) {
        if (test_data.words[wordIndex + 1][START_TIME] <= sound.currentTime)
            wordIndex++;

        if (test_data.words[wordIndex][START_TIME] < sound.currentTime) {
            prevFirstIndex = (wordIndex - 3 < 0) ? 0 : wordIndex - 3;
            prevLastIndex = (wordIndex - 1 < 0) ? 0 : wordIndex - 1;
            nextFirstIndex = (wordIndex + 1 < test_data.words.length) ? wordIndex + 1 : test_data.words.length-1;
            nextLastIndex = (wordIndex + 4 < test_data.words.length) ? wordIndex + 4 : test_data.words.length-1;

            const prevWords = test_data.words.slice(prevFirstIndex, wordIndex).map(w => "<span class=\"badge badge-secondary\">" + w[WORD] + "</span>");
            const nextWords = test_data.words.slice(nextFirstIndex, nextLastIndex).map(w => "<span class=\"badge badge-secondary\">" + w[WORD] + "</span>");

            currentHighlight = " <span class=\"badge badge-success\" word-index=\"" + wordIndex + "\" onClick=editShow()>" + test_data.words[wordIndex][WORD] + "</span> ";
            $("#current_words").html(prevWords.join(" ") + currentHighlight + nextWords.join(" "));
        }
    }
}

function updateProgressBar() {
    var playedPercent = Math.round(sound.currentTime/sound.duration * 100);
    if (playedPercent < 1)
        playedPercent = 1;
    $('#progressbar').css('width', playedPercent+'%').attr("aria-valuenow", playedPercent).text(Math.round(sound.currentTime*100)/100 + "s");
}

function editShow() {
    $('#word').val(test_data.words[wordIndex][WORD]);
    $('#start-time').val(test_data.words[wordIndex][START_TIME]);
    $('#end-time').val(test_data.words[wordIndex][END_TIME]);
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
    updateWord();
}

function addWord() {
    var newWord = window.prompt("add new word:", "");
    test_data.words.splice(wordIndex+1, 0, {'word': newWord, 'start_time': sound.currentTime, 'end_time': null});
    updateWord();
}

function playSound() {
if (sound.currentSrc == "") {
    sound.src = '/short.wav';
    sound.ontimeupdate = function(){
        //$('#timeInput').val(sound.currentTime);
        updateWord();
        updateTranscript();
        updateProgressBar();
    };
}

if (sound.paused) {
    sound.play();
    document.querySelector('#play').innerHTML = "Pause";
} else {
    sound.pause();
    document.querySelector('#play').innerHTML = "Play";
}
}

function stop() {
    sound.pause()
    sound.currentTime = 0;
}