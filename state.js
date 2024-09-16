var answerCodes = [];
var guessCodes = [];
var results = [];
var liedResults = [];
var lieCode;
var truthOrFiction;
var tOFCount = 0;

document.querySelector('.keyboard').addEventListener('click', e => {
    if (e.target.classList.contains('key')) {
        const key = e.target;
        if (key.innerText != '' && guessCodes.length < 5) {
            guessCodes.push(key.innerText);
            refresh();
        }
        if (key.classList.contains('back') && guessCodes.length > 0) {
            guessCodes.splice(-1);
            refresh();
        }
        if (key.classList.contains('enter')) {
            submit();
        }
    }
});
document.querySelector('.guesses').addEventListener('click', e => {
    if (e.target.classList.contains('code')) 
        if (isLieBrarians) {
            document.querySelector('.guess.submited:not(.checked)').classList.remove('wrong');
            if (lieCode != e.target) {
                document.querySelectorAll('.guess.submited:not(.checked) .code').forEach((b, i) => {
                    b.classList.remove('x', 'check', 'tilde');
                    b.classList.add(results[i]);
                });
                lieCode = e.target;
            }
            if (lieCode.classList.contains('x')) {
                lieCode.classList.remove('x');
                lieCode.classList.add('check');
            } else if (lieCode.classList.contains('check')) {
                lieCode.classList.remove('check');
                lieCode.classList.add('tilde');
            } else if (lieCode.classList.contains('tilde')) {
                lieCode.classList.remove('tilde');
                lieCode.classList.add('x');
            }
        } else {
            if (tOFCount < 3) {
                const checkedGuess = document.querySelectorAll('.submited.checked');
                const lastGuess = checkedGuess[checkedGuess.length - 1];
                if (lastGuess && !lastGuess.classList.contains('truth-or-fiction')) {
                    lastGuess.querySelectorAll('.code').forEach((b, i) => {
                        if (b.innerText == e.target.innerText) {
                            truthOrFiction = b;
                            send(i, '確認中');
                        }
                    })
                }
            }
        }
});

function refresh() {
    const codeArea = document.querySelector(isLieBrarians ? '.answer' : '.guesses .guess:not(.submited)');
    codeArea.classList.remove('wrong');
    document.querySelectorAll(isLieBrarians ? '.answer:not(.submited) .code' : '.guess:not(.submited) .code').forEach((b, i) => {
        b.innerText = guessCodes[i] ?? '';
    });
}
function submit() {
    const codeArea = document.querySelector(isLieBrarians ? '.answer:not(.submited)' : '.guess:not(.submited)');
    if (guessCodes.length == 5) {
        const words = guessCodes.reduce((obj, key) => obj && obj[key], dict);
        if (words) {
            if (isLieBrarians) {
                codeArea.querySelector('.words').innerText = words.join(', ');
                answerCodes = guessCodes;
                codeArea.classList.add('submited');
                guessCodes = [];
            } else send(guessCodes, '傳送中', () => {
                codeArea.querySelector('.words').innerText = words.join(', ');
                codeArea.classList.add('submited');
                guessCodes = [];
            });
        } else {
            codeArea.classList.add('wrong');
        }
    } else {
        codeArea.classList.add('wrong');
    }
}
function checkAnswer() {
    const guess = document.querySelector('.guess:not(.submited)');
    let checkCount = 0;
    guess.querySelectorAll('.code').forEach((b, i) => {
        let result = 'x';
        b.innerText = guessCodes[i];
        if (answerCodes.indexOf(guessCodes[i]) != -1) result = 'tilde';
        if (answerCodes[i] == guessCodes[i]) {
            result = 'check';
            checkCount++;
        };
        results[i] = result;
        lieResult = [];
        b.classList.add(result);
    });

    if (checkCount == 5) send('答對了');

    const codeArea = document.querySelector('.guess:not(.submited)');
    const words = guessCodes.reduce((obj, key) => obj && obj[key], dict);
    codeArea.querySelector('.words').innerText = words.join(', ');
    codeArea.classList.add('submited');
}
function test() {
    const guess = document.querySelector('.guess.submited:not(.checked)');
    liedResults = [];
    document.querySelectorAll('.guess.submited:not(.checked) .code').forEach((b, i) => {
        if (b.classList.contains('x')) liedResults.push('x');
        else if (b.classList.contains('check')) liedResults.push('check');
        else if (b.classList.contains('tilde')) liedResults.push('tilde');
    });

    if (JSON.stringify(liedResults) !== JSON.stringify(results)) {
        guess.classList.add('checked');
        send(liedResults);
    } else {
        guess.classList.add('wrong');
    }

}