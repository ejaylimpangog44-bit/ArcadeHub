/* ==========================================================================
   ARCADE HUB: ALL-IN-ONE GAME ENGINES MODULE (CLEANED & WIRED)
   ========================================================================== */

// ===================================================
// WORDSCAPE PRO ENGINE
// ===================================================
const wordscapeLevels = [
    { category: 'Easy Warmup', letters: ['C', 'A', 'T', 'S'], words: ['CATS', 'ACTS', 'CAST', 'SAT', 'CAT'] },
    { category: 'Easy Warmup', letters: ['P', 'L', 'A', 'Y'], words: ['PLAY', 'PAL', 'PAY', 'LAY'] },
    { category: 'Easy Warmup', letters: ['B', 'A', 'R', 'K'], words: ['BARK', 'BAR', 'BRA', 'ARK'] },
    { category: 'Easy Warmup', letters: ['S', 'T', 'A', 'R'], words: ['STAR', 'RATS', 'ARTS', 'TAR', 'RAT', 'SAT'] }
];
let wsLevelIdx = 0, wsScore = 0, wsFoundWords = [], wsCurrentSelection = '', wsActiveLetterNodes = [], wsIsDragging = false;

function startWordscapeGame() {
    audio.playSFX('click');
    wsLevelIdx = 0;
    wsScore = 0;
    loadWordscapeLevel();
}

function loadWordscapeLevel() {
    if(wsLevelIdx >= wordscapeLevels.length) wsLevelIdx = 0;
    let lvl = wordscapeLevels[wsLevelIdx];
    wsFoundWords = [];
    wsCurrentSelection = '';
    document.getElementById('ws-score').textContent = wsScore;
    document.getElementById('ws-level').textContent = wsLevelIdx + 1;
    document.getElementById('ws-found').textContent = `0/${lvl.words.length}`;
    document.getElementById('ws-category-badge').textContent = `Category: ${lvl.category}`;
    document.getElementById('ws-current-word').textContent = '_ _ _ _';
    document.getElementById('ws-status').textContent = "Swipe across letters to connect words!";

    let boardEl = document.getElementById('ws-word-board');
    boardEl.innerHTML = '';
    lvl.words.forEach((w, wIdx) => {
        let row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '6px';
        for(let i=0; i<w.length; i++) {
            let cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.style.width = '30px';
            cell.style.height = '30px';
            cell.style.fontSize = '0.95rem';
            cell.style.background = '#0b0f19';
            cell.id = `ws-slot-${wIdx}-${i}`;
            cell.textContent = '_';
            row.appendChild(cell);
        }
        boardEl.appendChild(row);
    });

    renderWordWheel();
}

function renderWordWheel() {
    let lvl = wordscapeLevels[wsLevelIdx];
    let wheelEl = document.getElementById('ws-letter-wheel');
    let existingButtons = wheelEl.querySelectorAll('button');
    existingButtons.forEach(b => b.remove());

    let letters = [...lvl.letters];
    wsActiveLetterNodes = [];

    letters.forEach((char, idx) => {
        let angle = (idx / letters.length) * Math.PI * 2 - Math.PI / 2;
        let x = 90 + Math.cos(angle) * 55;
        let y = 90 + Math.sin(angle) * 55;

        let btn = document.createElement('button');
        btn.className = 'action-btn ws-letter-node';
        btn.style.position = 'absolute';
        btn.style.left = `${x - 21}px`;
        btn.style.top = `${y - 21}px`;
        btn.style.width = '42px';
        btn.style.height = '42px';
        btn.style.borderRadius = '50%';
        btn.style.padding = '0';
        btn.style.fontSize = '1.1rem';
        btn.style.fontWeight = 'bold';
        btn.style.zIndex = '15';
        btn.textContent = char;
        btn.dataset.char = char;
        btn.dataset.index = idx;
        wheelEl.appendChild(btn);

        wsActiveLetterNodes.push({ el: btn, char, x, y });
    });

    setupWordWheelSwipeEvents();
}

function setupWordWheelSwipeEvents() {
    const wheelEl = document.getElementById('ws-letter-wheel');
    const traceCanvas = document.getElementById('ws-trace-canvas');
    const tCtx = traceCanvas.getContext('2d');

    const getEventPos = (e) => {
        const rect = wheelEl.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const moveDrag = (e) => {
        if(!wsIsDragging || isGamePaused) return;
        const pos = getEventPos(e);
        checkNodeHit(pos);
        drawTraceLine(pos);
        e.preventDefault();
    };

    const endDrag = () => {
        if(!wsIsDragging) return;
        wsIsDragging = false;
        tCtx.clearRect(0, 0, traceCanvas.width, traceCanvas.height);
        wsActiveLetterNodes.forEach(n => n.el.style.background = 'var(--primary)');
        
        window.removeEventListener('mousemove', moveDrag);
        window.removeEventListener('mouseup', endDrag);
        window.removeEventListener('touchmove', moveDrag);
        window.removeEventListener('touchend', endDrag);

        if(wsCurrentSelection.length > 0) {
            submitWordscapeGuess();
        }
    };

    const startDrag = (e) => {
        if(isGamePaused) return;
        wsIsDragging = true;
        wsCurrentSelection = '';
        wsActiveLetterNodes.forEach(n => n.el.style.background = 'var(--primary)');
        checkNodeHit(getEventPos(e));

        window.addEventListener('mousemove', moveDrag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchmove', moveDrag, { passive: false });
        window.addEventListener('touchend', endDrag);

        e.preventDefault();
    };

    wheelEl.onmousedown = startDrag;
    wheelEl.ontouchstart = startDrag;
}

function checkNodeHit(pos) {
    wsActiveLetterNodes.forEach(node => {
        let dist = Math.hypot(pos.x - node.x, pos.y - node.y);
        if(dist < 26 && !wsCurrentSelection.includes(node.char)) {
            audio.playSFX('move');
            wsCurrentSelection += node.char;
            node.el.style.background = 'var(--accent)';
            document.getElementById('ws-current-word').textContent = wsCurrentSelection.split('').join(' ');
        }
    });
}

function drawTraceLine(currentPos) {
    const traceCanvas = document.getElementById('ws-trace-canvas');
    const tCtx = traceCanvas.getContext('2d');
    tCtx.clearRect(0, 0, traceCanvas.width, traceCanvas.height);

    let selectedNodes = wsActiveLetterNodes.filter(n => wsCurrentSelection.includes(n.char));
    if(selectedNodes.length === 0) return;

    tCtx.strokeStyle = 'var(--accent)';
    tCtx.lineWidth = 5;
    tCtx.lineCap = 'round';
    tCtx.beginPath();
    tCtx.moveTo(selectedNodes[0].x, selectedNodes[0].y);
    for(let i=1; i<selectedNodes.length; i++) {
        tCtx.lineTo(selectedNodes[i].x, selectedNodes[i].y);
    }
    tCtx.lineTo(currentPos.x, currentPos.y);
    tCtx.stroke();
}

function shuffleWordLetters() {
    if(isGamePaused) return;
    audio.playSFX('click');
    let lvl = wordscapeLevels[wsLevelIdx];
    lvl.letters.sort(() => Math.random() - 0.5);
    renderWordWheel();
}

function clearWordSelection() {
    if(isGamePaused) return;
    audio.playSFX('click');
    wsCurrentSelection = '';
    document.getElementById('ws-current-word').textContent = '_ _ _ _';
    wsActiveLetterNodes.forEach(n => n.el.style.background = 'var(--primary)');
    const traceCanvas = document.getElementById('ws-trace-canvas');
    traceCanvas.getContext('2d').clearRect(0, 0, traceCanvas.width, traceCanvas.height);
}

function submitWordscapeGuess() {
    let lvl = wordscapeLevels[wsLevelIdx];
    if(lvl.words.includes(wsCurrentSelection) && !wsFoundWords.includes(wsCurrentSelection)) {
        audio.playSFX('win');
        wsFoundWords.push(wsCurrentSelection);
        wsScore += wsCurrentSelection.length * 50;
        document.getElementById('ws-score').textContent = wsScore;
        document.getElementById('ws-found').textContent = `${wsFoundWords.length}/${lvl.words.length}`;
        document.getElementById('ws-status').textContent = `🎉 Found word: ${wsCurrentSelection}!`;

        lvl.words.forEach((w, wIdx) => {
            if(w === wsCurrentSelection) {
                for(let i=0; i<w.length; i++) {
                    let slot = document.getElementById(`ws-slot-${wIdx}-${i}`);
                    if(slot) {
                        slot.textContent = w[i];
                        slot.style.background = 'var(--primary)';
                        slot.style.color = '#fff';
                    }
                }
            }
        });

        clearWordSelection();

        if(wsFoundWords.length === lvl.words.length) {
            audio.playSFX('win');
            document.getElementById('ws-status').textContent = "🌟 Level Complete! Loading next level...";
            ScoreManager.saveScore('wordscape', wsScore);
            submitScore('Wordscape Pro', 'TestPlayer', wsScore);
            setTimeout(() => {
                wsLevelIdx++;
                loadWordscapeLevel();
            }, 1500);
        }
    } else {
        audio.playSFX('gameover');
        document.getElementById('ws-status').textContent = wsFoundWords.includes(wsCurrentSelection) ? "Already found that word!" : "Not in word list!";
        clearWordSelection();
    }
}

// ===================================================
// SPEED SOLITAIRE SPRINT ENGINE (Fixed Card Range & Wrap)
// ===================================================
let solScore = 0, solTime = 60, solRunning = false, solTimer = null;
let solFoundationCard = { val: 7, suit: '♥️', name: '7' };
let solTableauCards = [];

function startSolitaireGame() {
    audio.playSFX('click');
    if(solTimer) clearInterval(solTimer);
    solScore = 0;
    solTime = 60;
    solRunning = true;
    document.getElementById('sol-score').textContent = solScore;
    document.getElementById('sol-time').textContent = `${solTime}s`;
    document.getElementById('sol-status').textContent = "Match cards that are 1 rank higher or lower!";

    solFoundationCard = generateRandomCard();
    solTableauCards = [generateRandomCard(), generateRandomCard(), generateRandomCard(), generateRandomCard()];
    updateSolitaireDisplay();

    solTimer = setInterval(() => {
        if(isGamePaused) return;
        solTime--;
        document.getElementById('sol-time').textContent = `${solTime}s`;
        if(solTime <= 0) {
            clearInterval(solTimer);
            solRunning = false;
            audio.playSFX('gameover');
            document.getElementById('sol-status').textContent = `⏰ Time's up! Final Score: ${solScore}`;
            ScoreManager.saveScore('solitaire', solScore);
            submitScore('Speed Solitaire', 'TestPlayer', solScore);
        }
    }, 1000);
}

function generateRandomCard() {
    let val = Math.floor(Math.random() * 12) + 2; // Values 2 through 13 (King)
    let suits = ['♠️', '♥️', '♦️', '♣️'];
    let suit = suits[Math.floor(Math.random() * suits.length)];
    let name = val === 11 ? 'J' : val === 12 ? 'Q' : val === 13 ? 'K' : val.toString();
    return { val, suit, name };
}

function updateSolitaireDisplay() {
    const fEl = document.getElementById('sol-foundation');
    fEl.textContent = `${solFoundationCard.name}${solFoundationCard.suit}`;
    fEl.style.color = (solFoundationCard.suit === '♥️' || solFoundationCard.suit === '♦️') ? '#f43f5e' : '#38bdf8';

    const tEl = document.getElementById('sol-tableau');
    tEl.innerHTML = '';
    solTableauCards.forEach((card, index) => {
        let cBox = document.createElement('div');
        cBox.className = 'ttt-cell';
        cBox.style.fontSize = '1.4rem';
        cBox.style.width = '65px';
        cBox.style.height = '85px';
        cBox.style.flexDirection = 'column';
        cBox.style.background = '#1e293b';
        cBox.style.color = (card.suit === '♥️' || card.suit === '♦️') ? '#f43f5e' : '#38bdf8';
        cBox.innerHTML = `<span>${card.name}</span><span style="font-size:1.8rem;">${card.suit}</span>`;
        cBox.onclick = () => playSolitaireCard(index);
        tEl.appendChild(cBox);
    });
}

function playSolitaireCard(index) {
    if(!solRunning || isGamePaused) return;
    let card = solTableauCards[index];
    let diff = Math.abs(card.val - solFoundationCard.val);

    if(diff === 1 || diff === 11) {
        audio.playSFX('score');
        solScore += 100;
        solFoundationCard = card;
        solTableauCards[index] = generateRandomCard();
        document.getElementById('sol-score').textContent = solScore;
        document.getElementById('sol-status').textContent = `🎉 Matched ${card.name}${card.suit}! +100 pts`;
        updateSolitaireDisplay();
        ScoreManager.saveScore('solitaire', solScore);
        submitScore('Speed Solitaire', 'TestPlayer', solScore);
    } else {
        audio.playSFX('move');
        document.getElementById('sol-status').textContent = `❌ Can't play ${card.name}${card.suit} on ${solFoundationCard.name}${solFoundationCard.suit}!`;
    }
}

function drawSolitaireCard() {
    if(!solRunning || isGamePaused) return;
    audio.playSFX('click');
    solTableauCards[Math.floor(Math.random() * solTableauCards.length)] = generateRandomCard();
    updateSolitaireDisplay();
    document.getElementById('sol-status').textContent = "New cards drawn into tableau!";
}

// ===================================================
// COIN SCATTER v2 ENGINE
// ===================================================
let scatterBalance = 1000000;
let scatterBet = 1000;
let scatterSpinsRemaining = 0;
let sessionTotalWins = 0;
let isScatterActive = false;

function initScatterGame() {
    let savedBal = localStorage.getItem('arcadehub_scatter_bal');
    if(savedBal !== null) scatterBalance = parseInt(savedBal);

    document.getElementById('scatter-balance').textContent = scatterBalance.toLocaleString();
    document.getElementById('scatter-spins-left').textContent = scatterSpinsRemaining;
}

function setScatterBet(amt, btn) {
    if(isScatterActive || scatterSpinsRemaining > 0 || isGamePaused) return;
    audio.playSFX('click');
    scatterBet = amt;
    document.querySelectorAll('#scattercard-container .opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function rollDiceForSpins() {
    if(isScatterActive || isGamePaused) return;

    if(scatterSpinsRemaining <= 0) {
        if(scatterBalance < scatterBet) {
            audio.playSFX('gameover');
            document.getElementById('scatter-status').textContent = "Not enough coins in balance! 💀";
            return;
        }
        scatterBalance -= scatterBet;
        document.getElementById('scatter-balance').textContent = scatterBalance.toLocaleString();

        const spinOptions = [3, 5, 10];
        scatterSpinsRemaining = spinOptions[Math.floor(Math.random() * spinOptions.length)];
        sessionTotalWins = 0; 
        
        audio.playSFX('powerup');
        document.getElementById('scatter-dice-display').textContent = `🎲 Rolled ${scatterSpinsRemaining} Spins!`;
        document.getElementById('scatter-spins-left').textContent = scatterSpinsRemaining;
        document.getElementById('scatter-spin-btn').textContent = "START SPINS (▶)";
        document.getElementById('scatter-status').textContent = `You got x${scatterSpinsRemaining} spins! Tap to spin the reels.`;
        return;
    }

    executeScatterSpin();
}

function executeScatterSpin() {
    if(isScatterActive || scatterSpinsRemaining <= 0 || isGamePaused) return;

    isScatterActive = true;
    scatterSpinsRemaining--;
    document.getElementById('scatter-spins-left').textContent = scatterSpinsRemaining;
    document.getElementById('scatter-spin-btn').disabled = true;
    document.getElementById('scatter-spin-btn').style.opacity = '0.5';
    document.getElementById('scatter-status').textContent = `🎰 Spinning reels (${scatterSpinsRemaining} left)...`;

    let gridCells = [];
    for(let i=0; i<9; i++) {
        gridCells.push(document.getElementById(`sc-${i}`));
        gridCells[i].style.borderColor = "var(--border)";
    }

    let rollingSymbols = ['🎴', '♠️', '♥️', '♦️', '♣️', '🪙', 'x3', 'x5', 'x10'];
    let rollIntervals = [];

    for(let i=0; i<9; i++) {
        rollIntervals[i] = setInterval(() => {
            if(isGamePaused) return;
            let randSym = rollingSymbols[Math.floor(Math.random() * rollingSymbols.length)];
            gridCells[i].textContent = randSym;
            gridCells[i].style.color = randSym.includes('x') ? '#facc15' : 'var(--text-main)';
            audio.playTone(300 + (i * 20), 0.04, 'triangle');
        }, 75);
    }

    for(let i=0; i<9; i++) {
        setTimeout(() => {
            if(isGamePaused) return;
            clearInterval(rollIntervals[i]);
            
            let multiplierPool = ['x3', 'x5', 'x10', null, null]; 
            let chosenMultiplier = multiplierPool[Math.floor(Math.random() * multiplierPool.length)];
            let standardSymbols = ['🎴', '♠️', '♥️', '♦️', '🪙'];

            if(chosenMultiplier && (i === 1 || i === 4 || i === 7)) {
                gridCells[i].textContent = chosenMultiplier;
                gridCells[i].style.color = '#facc15';
                gridCells[i].style.borderColor = '#facc15';
            } else {
                let sym = standardSymbols[Math.floor(Math.random() * standardSymbols.length)];
                gridCells[i].textContent = sym;
                gridCells[i].style.color = 'var(--text-main)';
                gridCells[i].style.borderColor = 'var(--border)';
            }
            audio.playSFX('click');

            if(i === 8) {
                finalizeScatterSpinWin(gridCells);
            }
        }, 600 + (i * 180));
    }
}

function finalizeScatterSpinWin(gridCells) {
    let roundWin = 0;
    for(let i=0; i<9; i++) {
        let txt = gridCells[i].textContent;
        if(txt.startsWith('x')) {
            let multVal = parseInt(txt.substring(1));
            roundWin += (scatterBet * multVal);
        }
    }

    isScatterActive = false;
    document.getElementById('scatter-spin-btn').disabled = false;
    document.getElementById('scatter-spin-btn').style.opacity = '1';

    if(roundWin > 0) {
        audio.playSFX('win');
        sessionTotalWins += roundWin;
        
        animateBalanceCount(scatterBalance, scatterBalance + roundWin, 600);
        scatterBalance += roundWin;
        
        document.getElementById('scatter-status').textContent = `🎉 Win! Collected +${roundWin.toLocaleString()} coins!`;
        ScoreManager.saveScore('scatter', roundWin);
        submitScore('Coin Scatter v2', 'TestPlayer', roundWin);
    } else {
        audio.playSFX('gameover');
        document.getElementById('scatter-status').textContent = "No multipliers this spin. Try again!";
    }

    localStorage.setItem('arcadehub_scatter_bal', scatterBalance);

    if(scatterSpinsRemaining > 0) {
        document.getElementById('scatter-spin-btn').textContent = `SPIN AGAIN (${scatterSpinsRemaining} left)`;
    } else {
        document.getElementById('scatter-spin-btn').textContent = "ROLL DICE & SPIN (🪙 Bet)";
        document.getElementById('scatter-status').textContent = "Spins finished! Select bet to roll dice again.";
        
        setTimeout(() => {
            showScatterWinModal(sessionTotalWins);
        }, 300);
    }
}

function showScatterWinModal(finalWinAmount) {
    const modal = document.getElementById('scatter-win-modal');
    const amountEl = document.getElementById('scatter-animated-win-amount');
    modal.classList.add('active');
    
    let duration = 800;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        let progress = Math.min((timestamp - startTimestamp) / duration, 1);
        let currentVal = Math.floor(progress * finalWinAmount);
        amountEl.textContent = `${currentVal.toLocaleString()} coins`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            amountEl.textContent = `${finalWinAmount.toLocaleString()} coins`;
        }
    };
    window.requestAnimationFrame(step);
}

function closeScatterWinModal() {
    audio.playSFX('click');
    document.getElementById('scatter-win-modal').classList.remove('active');
}

function animateBalanceCount(startVal, endVal, duration) {
    let startTimestamp = null;
    const balanceEl = document.getElementById('scatter-balance');
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        let progress = Math.min((timestamp - startTimestamp) / duration, 1);
        let currentVal = Math.floor(progress * (endVal - startVal) + startVal);
        balanceEl.textContent = currentVal.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ===================================================
// BLACKJACK 21 PRO ENGINE
// ===================================================
let bjBalance = 1000000;
let bjCurrentBet = 1000;
let bjPlayerHand = [], bjDealerHand = [];
let bjGameOver = true;

function startBlackjack(betAmount) {
    if(isGamePaused) return;
    let savedBal = localStorage.getItem('arcadehub_scatter_bal');
    if(savedBal !== null) bjBalance = parseInt(savedBal);

    if(bjBalance < betAmount) {
        audio.playSFX('gameover');
        document.getElementById('bj-status').textContent = "Not enough coins in balance! 💀";
        return;
    }

    bjCurrentBet = betAmount;
    bjBalance -= bjCurrentBet;
    document.getElementById('bj-balance').textContent = bjBalance.toLocaleString();
    document.getElementById('bj-bet').textContent = bjCurrentBet.toLocaleString();

    audio.playSFX('click');
    bjGameOver = false;

    bjPlayerHand = [randomCard(), randomCard()];
    bjDealerHand = [randomCard(), randomCard()];

    updateBJDisplay(false);
    document.getElementById('bj-bet-controls').style.display = 'none';
    document.getElementById('bj-action-controls').style.display = 'flex';
    document.getElementById('bj-status').textContent = "Hit or Stand?";

    if(calcHandScore(bjPlayerHand) === 21) {
        bjStand();
    }
}

function randomCard() {
    let val = Math.floor(Math.random() * 10) + 2;
    let suits = ['♠️', '♥️', '♦️', '♣️'];
    let suit = suits[Math.floor(Math.random() * suits.length)];
    return { val, name: val === 10 ? ['10','J','Q','K'][Math.floor(Math.random()*4)] : val.toString(), suit };
}

function calcHandScore(hand) {
    return hand.reduce((acc, c) => acc + c.val, 0);
}

function updateBJDisplay(showDealerHole) {
    document.getElementById('bj-player-cards').textContent = bjPlayerHand.map(c => `${c.name}${c.suit}`).join(' ');
    document.getElementById('bj-player-score').textContent = calcHandScore(bjPlayerHand);

    if(showDealerHole) {
        document.getElementById('bj-dealer-cards').textContent = bjDealerHand.map(c => `${c.name}${c.suit}`).join(' ');
        document.getElementById('bj-dealer-score').textContent = calcHandScore(bjDealerHand);
    } else {
        document.getElementById('bj-dealer-cards').textContent = `${bjDealerHand[0].name}${bjDealerHand[0].suit} 🎴`;
        document.getElementById('bj-dealer-score').textContent = bjDealerHand[0].val;
    }
}

function bjHit() {
    if(bjGameOver || isGamePaused) return;
    audio.playSFX('move');
    bjPlayerHand.push(randomCard());
    updateBJDisplay(false);

    let score = calcHandScore(bjPlayerHand);
    if(score > 21) {
        audio.playSFX('gameover');
        bjGameOver = true;
        updateBJDisplay(true);
        document.getElementById('bj-status').textContent = "Bust! You went over 21. 💀";
        endBJRound();
    }
}

function bjStand() {
    if(bjGameOver || isGamePaused) return;
    audio.playSFX('click');
    bjGameOver = true;
    updateBJDisplay(true);

    let dealerScore = calcHandScore(bjDealerHand);
    while(dealerScore < 17) {
        bjDealerHand.push(randomCard());
        dealerScore = calcHandScore(bjDealerHand);
        updateBJDisplay(true);
    }

    let playerScore = calcHandScore(bjPlayerHand);
    let statusText = "";

    if(dealerScore > 21 || playerScore > dealerScore) {
        audio.playSFX('win');
        let winnings = bjCurrentBet * 2;
        bjBalance += winnings;
        statusText = `🎉 You Win +${winnings.toLocaleString()} coins!`;
        ScoreManager.saveScore('blackjack', winnings);
        submitScore('Blackjack 21', 'TestPlayer', winnings);
    } else if(playerScore === dealerScore) {
        audio.playSFX('move');
        bjBalance += bjCurrentBet;
        statusText = "Push! Bet returned. 🤝";
    } else {
        audio.playSFX('gameover');
        statusText = "Dealer wins! Better luck next time. 💀";
    }

    document.getElementById('bj-status').textContent = statusText;
    endBJRound();
}

function endBJRound() {
    document.getElementById('bj-balance').textContent = bjBalance.toLocaleString();
    localStorage.setItem('arcadehub_scatter_bal', bjBalance);
    document.getElementById('bj-bet-controls').style.display = 'flex';
    document.getElementById('bj-action-controls').style.display = 'none';
}

// ===================================================
// HIGH-LOW PREDICTOR ENGINE
// ===================================================
let hlBalance = 1000000;
let hlCurrentCard = 7;
let hlStreak = 0;

function initHighLowGame() {
    let savedBal = localStorage.getItem('arcadehub_scatter_bal');
    if(savedBal !== null) hlBalance = parseInt(savedBal);
    document.getElementById('hl-balance').textContent = hlBalance.toLocaleString();

    hlCurrentCard = Math.floor(Math.random() * 11) + 2;
    hlStreak = 0;
    document.getElementById('hl-streak').textContent = hlStreak;
    document.getElementById('hl-card-display').textContent = `🎴 ${hlCurrentCard}`;
    document.getElementById('hl-status').textContent = "Will the next card be Higher or Lower?";
}

function guessHighLow(guess) {
    if(isGamePaused) return;
    audio.playSFX('click');
    let nextCard = Math.floor(Math.random() * 11) + 2;
    let success = (guess === 'higher' && nextCard >= hlCurrentCard) || (guess === 'lower' && nextCard <= hlCurrentCard);

    if(success) {
        audio.playSFX('win');
        hlStreak++;
        let reward = 500 * hlStreak;
        hlBalance += reward;
        document.getElementById('hl-status').textContent = `🎉 Correct! Next card was ${nextCard}. Won +${reward} coins!`;
        ScoreManager.saveScore('highlow', hlStreak);
        submitScore('High-Low', 'TestPlayer', hlStreak);
    } else {
        audio.playSFX('gameover');
        hlStreak = 0;
        document.getElementById('hl-status').textContent = `💀 Wrong! Next card was ${nextCard}. Streak reset!`;
    }

    hlCurrentCard = nextCard;
    document.getElementById('hl-card-display').textContent = `🎴 ${hlCurrentCard}`;
    document.getElementById('hl-streak').textContent = hlStreak;
    document.getElementById('hl-balance').textContent = hlBalance.toLocaleString();
    localStorage.setItem('arcadehub_scatter_bal', hlBalance);
}

// ===================================================
// TURBO CAR RACING ENGINE
// ===================================================
let carCanvas, carCtx, carRunning = false, carAnimId, carScore = 0, carCoinsCollected = 0;
let playerCar = { lane: 1, x: 0, y: 280, width: 34, height: 56, shieldTimer: 0 };
let trafficCars = [], carCollectibles = [], roadOffset = 0, carBoostActive = 0, carBoostCharge = 100;
const lanes = [65, 140, 215];

function initCarCanvas() {
    carCanvas = document.getElementById('car-canvas');
    if(carCanvas) carCtx = carCanvas.getContext('2d');
}

function startCarGame() {
    audio.playSFX('click');
    document.getElementById('car-gameover-overlay').style.display = 'none';
    initCarCanvas();
    if(!carCtx) return;
    carRunning = true;
    carScore = 0;
    carCoinsCollected = 0;
    playerCar.lane = 1;
    playerCar.shieldTimer = 0;
    trafficCars = [];
    carCollectibles = [];
    roadOffset = 0;
    carBoostActive = 0;
    carBoostCharge = 100;
    document.getElementById('car-coins').textContent = 0;
    document.getElementById('car-shield-time').textContent = 'OFF';
    document.getElementById('car-high').textContent = ScoreManager.getStats('carracing').highScore;
    cancelAnimationFrame(carAnimId);
    carLoop();
}

function moveCar(dir) {
    if(!carRunning || isGamePaused) return;
    audio.playSFX('move');
    if(dir === 'LEFT' && playerCar.lane > 0) playerCar.lane--;
    if(dir === 'RIGHT' && playerCar.lane < 2) playerCar.lane++;
}

function triggerCarBoost() {
    if(!carRunning || carBoostActive > 0 || carBoostCharge < 100 || isGamePaused) return;
    audio.playSFX('powerup');
    carBoostActive = 100;
    carBoostCharge = 0;
}

let carSpawnTimer = 0;
function carLoop() {
    if(!carRunning) return;
    if(isGamePaused) {
        carAnimId = requestAnimationFrame(carLoop);
        return;
    }

    if(carBoostActive > 0) {
        carBoostActive--;
    } else if(carBoostCharge < 100) {
        carBoostCharge = Math.min(100, carBoostCharge + 0.6);
    }

    let boostBtn = document.getElementById('car-boost-btn');
    if(boostBtn) {
        if(carBoostActive > 0) {
            boostBtn.textContent = "⚡ BOOSTING!";
            boostBtn.style.opacity = '1';
        } else if(carBoostCharge < 100) {
            boostBtn.textContent = `⏳ RECHARGING (${Math.floor(carBoostCharge)}%)`;
            boostBtn.style.opacity = '0.5';
        } else {
            boostBtn.textContent = "⚡ READY TO BOOST";
            boostBtn.style.opacity = '1';
        }
    }

    let speedMult = carBoostActive > 0 ? 2.2 : 1.0;
    carScore += Math.floor(1 * speedMult);
    roadOffset = (roadOffset + (6 * speedMult)) % 40;

    if(playerCar.shieldTimer > 0) {
        playerCar.shieldTimer--;
        let secondsLeft = Math.ceil(playerCar.shieldTimer / 60);
        document.getElementById('car-shield-time').textContent = `${secondsLeft}s`;
        if(playerCar.shieldTimer <= 0) {
            document.getElementById('car-shield-time').textContent = 'OFF';
        }
    }

    carSpawnTimer++;
    if(carSpawnTimer > Math.max(20, 45 - Math.floor(carScore / 200))) {
        carSpawnTimer = 0;
        let laneIdx = Math.floor(Math.random() * 3);
        trafficCars.push({ lane: laneIdx, y: -70, speed: (4 + Math.random() * 2) * (1 + carScore/5000), color: ['#ef4444','#ec4899','#10b981','#f59e0b'][Math.floor(Math.random()*4)] });

        if(Math.random() < 0.4) {
            let cLane = (laneIdx + 1 + Math.floor(Math.random()*2)) % 3;
            let type = Math.random() < 0.25 ? 'shield' : (Math.random() < 0.2 ? 'nitro' : 'coin');
            carCollectibles.push({ lane: cLane, y: -40, type });
        }
    }

    trafficCars.forEach(tc => { tc.y += tc.speed * (carBoostActive > 0 ? 0.5 : 1.0); });
    carCollectibles.forEach(c => { c.y += 4 * speedMult; });
    trafficCars = trafficCars.filter(tc => tc.y < 380);
    carCollectibles = carCollectibles.filter(c => c.y < 380);

    playerCar.x = lanes[playerCar.lane] - playerCar.width / 2;

    carCollectibles.forEach(c => {
        if(playerCar.lane === c.lane && playerCar.y < c.y + 20 && playerCar.y + playerCar.height > c.y) {
            c.y = 999;
            if(c.type === 'coin') {
                audio.playSFX('score');
                carCoinsCollected += 1;
                carScore += 50;
                document.getElementById('car-coins').textContent = carCoinsCollected;
            } else if(c.type === 'shield') {
                audio.playSFX('powerup');
                playerCar.shieldTimer = 300;
                document.getElementById('car-shield-time').textContent = '5s';
            } else if(c.type === 'nitro') {
                audio.playSFX('powerup');
                carBoostCharge = 100;
                triggerCarBoost();
            }
        }
    });

    trafficCars.forEach(tc => {
        if(playerCar.lane === tc.lane && playerCar.y < tc.y + 56 && playerCar.y + playerCar.height > tc.y) {
            if(carBoostActive > 0) {
                tc.y = 999;
                audio.playSFX('score');
                carScore += 100;
            } else if(playerCar.shieldTimer > 0) {
                playerCar.shieldTimer = 0;
                document.getElementById('car-shield-time').textContent = 'OFF';
                tc.y = 999;
                audio.playSFX('gameover');
            } else {
                carRunning = false;
                audio.playSFX('gameover');
                let finalSc = Math.floor(carScore / 5);
                document.getElementById('car-final-msg').textContent = `Final Score: ${finalSc} | Coins: ${carCoinsCollected}`;
                document.getElementById('car-gameover-overlay').style.display = 'flex';
                let stats = ScoreManager.saveScore('carracing', finalSc);
                submitScore('Car Racing', 'TestPlayer', finalSc);
                document.getElementById('car-high').textContent = stats.highScore;
            }
        }
    });

    carCtx.fillStyle = '#1e293b';
    carCtx.fillRect(0, 0, 280, 360);
    carCtx.fillStyle = carBoostActive > 0 ? '#0284c7' : '#0f172a';
    carCtx.fillRect(0, 0, 30, 360);
    carCtx.fillRect(250, 0, 30, 360);

    carCtx.strokeStyle = '#ffffff';
    carCtx.lineWidth = 3;
    carCtx.setLineDash([20, 20]);
    carCtx.lineDashOffset = -roadOffset;
    carCtx.beginPath(); carCtx.moveTo(105, 0); carCtx.lineTo(105, 360); carCtx.stroke();
    carCtx.beginPath(); carCtx.moveTo(175, 0); carCtx.lineTo(175, 360); carCtx.stroke();
    carCtx.setLineDash([]);

    carCollectibles.forEach(c => {
        let cx = lanes[c.lane];
        if(c.type === 'coin') {
            carCtx.fillStyle = '#facc15'; carCtx.beginPath(); carCtx.arc(cx, c.y, 9, 0, Math.PI*2); carCtx.fill();
            carCtx.fillStyle = '#000'; carCtx.font = 'bold 10px sans-serif'; carCtx.fillText('$', cx-3, c.y+3);
        } else if(c.type === 'shield') {
            carCtx.fillStyle = '#38bdf8'; carCtx.beginPath(); carCtx.arc(cx, c.y, 11, 0, Math.PI*2); carCtx.fill();
            carCtx.fillStyle = '#fff'; carCtx.font = '10px sans-serif'; carCtx.fillText('🛡️', cx-6, c.y+4);
        } else if(c.type === 'nitro') {
            carCtx.fillStyle = '#ef4444'; carCtx.beginPath(); carCtx.arc(cx, c.y, 11, 0, Math.PI*2); carCtx.fill();
            carCtx.fillStyle = '#fff'; carCtx.font = '10px sans-serif'; carCtx.fillText('⚡', cx-6, c.y+4);
        }
    });

    trafficCars.forEach(tc => {
        let tx = lanes[tc.lane] - playerCar.width / 2;
        carCtx.fillStyle = tc.color;
        carCtx.beginPath(); carCtx.roundRect(tx, tc.y, playerCar.width, playerCar.height, 6); carCtx.fill();
        carCtx.fillStyle = '#020617'; carCtx.fillRect(tx + 5, tc.y + 10, playerCar.width - 10, 12);
    });

    carCtx.fillStyle = carBoostActive > 0 ? '#38bdf8' : 'var(--primary, #8b5cf6)';
    carCtx.beginPath(); carCtx.roundRect(playerCar.x, playerCar.y, playerCar.width, playerCar.height, 6); carCtx.fill();
    carCtx.fillStyle = '#38bdf8'; carCtx.fillRect(playerCar.x + 5, playerCar.y + 12, playerCar.width - 10, 14);

    if(playerCar.shieldTimer > 0) {
        carCtx.strokeStyle = '#38bdf8'; carCtx.lineWidth = 3;
        carCtx.beginPath(); carCtx.arc(playerCar.x + playerCar.width/2, playerCar.y + playerCar.height/2, 32, 0, Math.PI*2); carCtx.stroke();
    }

    if(carRunning) carAnimId = requestAnimationFrame(carLoop);
}

window.addEventListener('keydown', e => {
    if(!document.getElementById('carracing-container').classList.contains('active') || isGamePaused) return;
    if(e.code === 'ArrowLeft') { e.preventDefault(); moveCar('LEFT'); }
    if(e.code === 'ArrowRight') { e.preventDefault(); moveCar('RIGHT'); }
    if(e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); triggerCarBoost(); }
});

// ===================================================
// TIC-TAC-TOE PRO ENGINE
// ===================================================
let tttBoard = [], tttGridSize = 3;
let currentPlayer = 'X', isGameActive = true, selectedMode = 'pvp', selectedDiff = 'easy', gameMode = 'pvp', aiDifficulty = 'easy';
let tttScore = { X: 0, O: 0, Draws: 0 };

function selectSetupMode(mode) { audio.playSFX('move'); selectedMode=mode; document.getElementById('setup-pvp').classList.toggle('active',mode==='pvp'); document.getElementById('setup-ai').classList.toggle('active',mode==='ai'); document.getElementById('setup-diff-group').style.display=mode==='ai'?'block':'none'; }
function selectSetupGrid(sz) { audio.playSFX('move'); tttGridSize=sz; document.getElementById('setup-grid-3').classList.toggle('active',sz===3); document.getElementById('setup-grid-4').classList.toggle('active',sz===4); }
function selectSetupDiff(diff) { audio.playSFX('move'); selectedDiff=diff; ['easy','normal','hard'].forEach(d=>document.getElementById(`setup-${d}`).classList.toggle('active',d===diff)); }
function startLoadingScreen() { audio.playSFX('click'); gameMode=selectedMode; aiDifficulty=selectedDiff; document.getElementById('ttt-setup-screen').classList.remove('active'); document.getElementById('ttt-loading-screen').classList.add('active'); setTimeout(()=>{document.getElementById('ttt-loading-screen').classList.remove('active');document.getElementById('ttt-game-screen').classList.add('active');resetTTT();},600); }
function backToSetup() { audio.playSFX('click'); document.getElementById('ttt-game-screen').classList.remove('active'); document.getElementById('ttt-setup-screen').classList.add('active'); }

function renderBoardHTML() {
    const boardEl = document.getElementById('ttt-board');
    boardEl.style.gridTemplateColumns = `repeat(${tttGridSize}, 1fr)`;
    boardEl.innerHTML = '';
    tttBoard = Array(tttGridSize * tttGridSize).fill('');
    for(let i=0; i<tttGridSize*tttGridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        cell.onclick = () => handleCellClick(i);
        boardEl.appendChild(cell);
    }
}

function handleCellClick(index) { 
    if(tttBoard[index]!==''||!isGameActive||isGamePaused) return; 
    if(gameMode==='ai'&&currentPlayer==='O') return; 
    audio.playSFX('move'); 
    makeMove(index,currentPlayer); 
    if(isGameActive&&gameMode==='ai'&&currentPlayer==='O') setTimeout(aiMove, 350); 
}

function checkWinCondition(board, size) {
    let winLines = [];
    for(let i=0; i<size; i++) {
        let row = [], col = [];
        for(let j=0; j<size; j++) {
            row.push(i*size + j);
            col.push(j*size + i);
        }
        winLines.push(row, col);
    }
    let d1 = [], d2 = [];
    for(let i=0; i<size; i++) {
        d1.push(i*size + i);
        d2.push(i*size + (size - 1 - i));
    }
    winLines.push(d1, d2);

    for(let line of winLines) {
        let first = board[line[0]];
        if(first && line.every(idx => board[idx] === first)) {
            return { winner: first, line };
        }
    }
    if(!board.includes('')) return { winner: 'DRAW' };
    return null;
}

function makeMove(index, player) {
    tttBoard[index]=player; 
    const cell=document.getElementById('ttt-board').children[index]; 
    cell.textContent=player; cell.classList.add(player.toLowerCase());

    let res = checkWinCondition(tttBoard, tttGridSize);
    if(res) {
        if(res.winner === 'DRAW') {
            audio.playSFX('gameover');
            document.getElementById('ttt-status').textContent="It's a Draw! 🤝";
            tttScore.Draws++;
        } else {
            audio.playSFX('win');
            document.getElementById('ttt-status').textContent=gameMode==='ai'&&player==='O'?'AI Wins! 🤖':`Player ${player} Wins! 🎉`;
            tttScore[player]++;
            ScoreManager.saveScore('tictactoe', tttScore.X);
            submitScore('Tic-Tac-Toe', 'TestPlayer', tttScore.X);
        }
        document.getElementById('ttt-score-x').textContent = tttScore.X;
        document.getElementById('ttt-score-o').textContent = tttScore.O;
        document.getElementById('ttt-score-draws').textContent = tttScore.Draws;
        isGameActive=false;
        return;
    }
    currentPlayer=currentPlayer==='X'?'O':'X'; 
    document.getElementById('ttt-status').textContent=gameMode==='ai'&&currentPlayer==='O'?'AI\'s Turn...': `Player ${currentPlayer}'s Turn`;
}

function minimax(newBoard, player) {
    let res = checkWinCondition(newBoard, 3);
    if (res) {
        if (res.winner === 'X') return { score: -10 };
        if (res.winner === 'O') return { score: 10 };
        if (res.winner === 'DRAW') return { score: 0 };
    }

    let availSpots = [];
    newBoard.forEach((v, i) => { if (v === '') availSpots.push(i); });

    let moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        let move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            let result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            let result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    return moves[bestMove];
}

function aiMove() { 
    if(!isGameActive || isGamePaused) return; 
    let empty = []; 
    tttBoard.forEach((v, i) => { if (v === '') empty.push(i); }); 
    if(empty.length === 0) return; 

    let targetIdx;
    if (aiDifficulty === 'hard' && tttGridSize === 3) {
        let bestCall = minimax(tttBoard, 'O');
        targetIdx = bestCall.index;
    } else {
        targetIdx = empty[Math.floor(Math.random() * empty.length)];
    }

    audio.playSFX('move'); 
    makeMove(targetIdx, 'O'); 
}

function resetTTT() { 
    audio.playSFX('click'); 
    currentPlayer='X'; isGameActive=true; 
    document.getElementById('ttt-status').textContent="Player X's Turn"; 
    document.getElementById('win-line').style.display='none'; 
    renderBoardHTML();
}

// ===================================================
// FRUIT MASTER ENGINE
// ===================================================
let fruitCanvas, fruitCtx, fruitRunning = false, fruitAnimId, fruitScore = 0, fruitLives = 3, flyingFruits = [], sliceTrails = [], fruitHalves = [];

function initFruitCanvas() {
    fruitCanvas = document.getElementById('fruit-canvas'); 
    if (!fruitCanvas) return; 
    fruitCtx = fruitCanvas.getContext('2d'); 
    let isDragging = false;

    const registerSwipe = (clientX, clientY) => {
        if (!fruitRunning || isGamePaused) return;
        const rect = fruitCanvas.getBoundingClientRect();
        let cx = (clientX - rect.left) * (fruitCanvas.width / rect.width);
        let cy = (clientY - rect.top) * (fruitCanvas.height / rect.height);
        sliceTrails.push({ x: cx, y: cy, alpha: 1.0 });

        flyingFruits.forEach(f => {
            if (!f.sliced && Math.hypot(f.x - cx, f.y - cy) < f.radius + 20) {
                f.sliced = true;
                if (f.isBomb) {
                    audio.playSFX('gameover');
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                    fruitLives--;
                    document.getElementById('fruit-lives').textContent = fruitLives;
                    if (fruitLives <= 0) endFruitGame();
                } else {
                    audio.playSFX('score');
                    fruitScore += f.points;
                    document.getElementById('fruit-score').textContent = fruitScore;

                    fruitHalves.push(
                        { x: f.x - 6, y: f.y, vx: -2.5, vy: -3, emoji: f.emoji, rot: -0.2, vRot: -0.1 },
                        { x: f.x + 6, y: f.y, vx: 2.5, vy: -3, emoji: f.emoji, rot: 0.2, vRot: 0.1 }
                    );
                }
            }
        });
    };

    fruitCanvas.onmousedown = e => { isDragging = true; registerSwipe(e.clientX, e.clientY); };
    fruitCanvas.onmousemove = e => { if (isDragging) registerSwipe(e.clientX, e.clientY); };
    window.onmouseup = () => { isDragging = false; };

    fruitCanvas.ontouchstart = e => { isDragging = true; registerSwipe(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); };
    fruitCanvas.ontouchmove = e => { if (isDragging) registerSwipe(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); };
    fruitCanvas.ontouchend = () => { isDragging = false; };
}

function startFruitGame() { 
    audio.playSFX('click'); 
    document.getElementById('fruit-gameover-overlay').style.display = 'none'; 
    initFruitCanvas(); 
    if (!fruitCtx) return; 
    fruitRunning = true; 
    fruitScore = 0; 
    fruitLives = 3; 
    flyingFruits = []; 
    fruitHalves = [];
    sliceTrails = []; 
    document.getElementById('fruit-score').textContent = 0; 
    document.getElementById('fruit-lives').textContent = 3; 
    cancelAnimationFrame(fruitAnimId); 
    fruitLoop(); 
}

let fruitTick = 0;
function fruitLoop() {
    if (!fruitRunning) return; 
    if (isGamePaused) {
        fruitAnimId = requestAnimationFrame(fruitLoop);
        return;
    }
    fruitTick++;
    if (fruitTick % 45 === 0) {
        let isBomb = Math.random() < 0.18;
        const types = [{ emoji: '🍉', points: 20 }, { emoji: '🍎', points: 10 }, { emoji: '🍌', points: 15 }, { emoji: '🍊', points: 15 }];
        let chosen = isBomb ? { emoji: '💣', points: 0 } : types[Math.floor(Math.random() * types.length)];
        flyingFruits.push({ x: 50 + Math.random() * 200, y: 330, vx: (Math.random() - 0.5) * 4, vy: -11 - Math.random() * 3, gravity: 0.35, radius: 20, emoji: chosen.emoji, points: chosen.points, isBomb, sliced: false });
    }

    fruitCtx.fillStyle = '#111827'; 
    fruitCtx.fillRect(0, 0, fruitCanvas.width, fruitCanvas.height);

    flyingFruits.forEach(f => {
        f.x += f.vx; 
        f.vy += f.gravity; 
        f.y += f.vy;
        if (!f.sliced) {
            fruitCtx.font = '28px sans-serif'; 
            fruitCtx.textAlign = 'center'; 
            fruitCtx.textBaseline = 'middle'; 
            fruitCtx.fillText(f.emoji, f.x, f.y);
        }
    });
    flyingFruits = flyingFruits.filter(f => f.y < 360);

    fruitHalves.forEach(h => {
        h.x += h.vx;
        h.vy += 0.4;
        h.y += h.vy;
        h.rot += h.vRot;

        fruitCtx.save();
        fruitCtx.translate(h.x, h.y);
        fruitCtx.rotate(h.rot);
        fruitCtx.font = '24px sans-serif';
        fruitCtx.textAlign = 'center';
        fruitCtx.textBaseline = 'middle';
        fruitCtx.fillText(h.emoji, 0, 0);
        fruitCtx.restore();
    });
    fruitHalves = fruitHalves.filter(h => h.y < 360);

    sliceTrails.forEach(t => {
        t.alpha -= 0.1;
        if (t.alpha > 0) {
            fruitCtx.strokeStyle = `rgba(56, 189, 248, ${t.alpha})`;
            fruitCtx.shadowColor = '#38bdf8';
            fruitCtx.shadowBlur = 8;
            fruitCtx.lineWidth = 4;
            fruitCtx.beginPath(); 
            fruitCtx.arc(t.x, t.y, 6, 0, Math.PI * 2); 
            fruitCtx.stroke();
            fruitCtx.shadowBlur = 0;
        }
    });
    sliceTrails = sliceTrails.filter(t => t.alpha > 0); 

    if (fruitRunning) fruitAnimId = requestAnimationFrame(fruitLoop);
}

function endFruitGame() { 
    fruitRunning = false; 
    audio.playSFX('gameover'); 
    document.getElementById('fruit-final-msg').textContent = `Final Score: ${fruitScore}`;
    document.getElementById('fruit-gameover-overlay').style.display = 'flex'; 
    ScoreManager.saveScore('fruitslasher', fruitScore); 
    submitScore('Fruit Master', 'TestPlayer', fruitScore);
}

// ===================================================
// NUMBER MASTER ENGINE
// ===================================================
let guessMaxRange = 100, targetNumber = Math.floor(Math.random()*100)+1, guessAttempts = 0, guessLivesLeft = 7;

function setGuessDiff(maxVal) {
    if(isGamePaused) return;
    audio.playSFX('click');
    guessMaxRange = maxVal;
    document.getElementById('guess-diff-1').classList.toggle('active', maxVal===100);
    document.getElementById('guess-diff-2').classList.toggle('active', maxVal===500);
    document.getElementById('guess-diff-3').classList.toggle('active', maxVal===1000);
    document.getElementById('guess-input').placeholder = `Enter 1-${maxVal}`;
    resetGuessGame();
}

function submitGuess() {
    if(isGamePaused) return;
    const val=parseInt(document.getElementById('guess-input').value); 
    const status=document.getElementById('guess-status');
    if(isNaN(val)||val<1||val>guessMaxRange){status.textContent=`Enter 1-${guessMaxRange}!`;return;} 

    audio.playSFX('click'); 
    guessAttempts++; 
    guessLivesLeft--;
    document.getElementById('guess-attempts').textContent=guessAttempts;
    document.getElementById('guess-lives').textContent=guessLivesLeft;

    if(val===targetNumber){
        audio.playSFX('win');
        status.textContent=`🎉 Correct! The number was ${targetNumber}.`;
        ScoreManager.saveScore('guess', guessAttempts);
        submitScore('Number Master', 'TestPlayer', guessAttempts);
    } else if(guessLivesLeft <= 0) {
        audio.playSFX('gameover');
        status.textContent=`💀 Out of lives! Target was ${targetNumber}.`;
    } else if(val<targetNumber) {
        status.textContent="📈 Too low! Go higher.";
    } else {
        status.textContent="📉 Too high! Go lower.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const guessInputEl = document.getElementById('guess-input');
    if(guessInputEl) {
        guessInputEl.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                submitGuess();
            }
        });
    }
});

function resetGuessGame() { 
    audio.playSFX('click'); 
    targetNumber=Math.floor(Math.random()*guessMaxRange)+1; 
    guessAttempts=0; 
    guessLivesLeft = guessMaxRange === 100 ? 7 : 10;
    document.getElementById('guess-attempts').textContent='0'; 
    document.getElementById('guess-lives').textContent=guessLivesLeft; 
    document.getElementById('guess-input').value=''; 
    document.getElementById('guess-status').textContent="Take a guess!"; 
}

// ===================================================
// WHACK-A-MOLE PRO ENGINE
// ===================================================
let moleActiveIdx = -1, moleScore = 0, moleTimer = null, isMolePlaying = false, moleTimeLeft = 20;

function startMoleGame() {
    audio.playSFX('click'); if(isMolePlaying || isGamePaused)return; 
    isMolePlaying=true; moleScore=0; moleTimeLeft=20;
    document.getElementById('mole-score').textContent='0'; 
    document.getElementById('mole-time').textContent='20s'; 
    document.getElementById('mole-start-btn').textContent='Playing (2x Speed)...';

    moleTimer=setInterval(()=>{
        if(isGamePaused) return;
        moleTimeLeft--;
        document.getElementById('mole-time').textContent=`${moleTimeLeft}s`;

        document.querySelectorAll('#molegame-container .mole-hole').forEach(h=>h.classList.remove('active'));
        moleActiveIdx=Math.floor(Math.random()*9);
        document.querySelectorAll('#molegame-container .mole-hole')[moleActiveIdx].classList.add('active');

        if(moleTimeLeft <= 0) {
            clearInterval(moleTimer);
            document.querySelectorAll('#molegame-container .mole-hole').forEach(h=>h.classList.remove('active'));
            isMolePlaying=false;
            document.getElementById('mole-start-btn').textContent='Start Game (2x Speed)';
            audio.playSFX('win');
            let stats=ScoreManager.saveScore('mole',moleScore);
            submitScore('Whack-a-Mole', 'TestPlayer', moleScore);
            document.getElementById('mole-high').textContent=stats.highScore;
        }
    },325);
}
function whackMole(idx) { 
    if(!isMolePlaying || isGamePaused)return; 
    if(idx===moleActiveIdx){
        audio.playSFX('score');
        moleScore+=10;
        document.getElementById('mole-score').textContent=moleScore;
        document.querySelectorAll('#molegame-container .mole-hole')[idx].classList.remove('active');
        moleActiveIdx=-1;
    } 
}

// ===================================================
// CYBER SNAKE (FULL UPGRADED VERSION)
// ===================================================
let snakeCanvas, snakeCtx, snake = [], snakeFood = {}, snakeBonus = null, snakeDir = 'RIGHT', nextSnakeDir = 'RIGHT';
let snakeInterval = null, snakeScore = 0, snakeCombo = 1, snakeComboTimer = 0, snakeParticles = [], snakeGhostTimer = 0;

function initSnakeCanvas() {
    snakeCanvas = document.getElementById('snake-canvas');
    if (snakeCanvas) snakeCtx = snakeCanvas.getContext('2d');
}

function startSnakeGame() {
    audio.playSFX('click');
    document.getElementById('snake-gameover-overlay').style.display = 'none';
    initSnakeCanvas();
    if (!snakeCtx) return;
    if (snakeInterval) clearInterval(snakeInterval);

    snake = [{ x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }];
    snakeDir = 'RIGHT';
    nextSnakeDir = 'RIGHT';
    snakeScore = 0;
    snakeCombo = 1;
    snakeComboTimer = 0;
    snakeBonus = null;
    snakeParticles = [];
    snakeGhostTimer = 0;

    document.getElementById('snake-score').textContent = 0;
    document.getElementById('snake-speed-lvl').textContent = '1x';
    document.getElementById('snake-high').textContent = ScoreManager.getStats('snake').highScore;

    spawnRealSnakeFood();
    snakeInterval = setInterval(updateRealSnake, 115);
}

function spawnRealSnakeFood() {
    snakeFood = { x: Math.floor(Math.random() * 24) + 1, y: Math.floor(Math.random() * 24) + 1 };
    if (Math.random() < 0.35 && !snakeBonus) {
        snakeBonus = {
            x: Math.floor(Math.random() * 24) + 1,
            y: Math.floor(Math.random() * 24) + 1,
            type: Math.random() < 0.5 ? 'gold' : 'ghost',
            ttl: 65
        };
    }
}

function changeSnakeDir(dir) {
    if (isGamePaused) return;
    audio.playSFX('move');
    if (dir === 'UP' && snakeDir !== 'DOWN') nextSnakeDir = 'UP';
    if (dir === 'DOWN' && snakeDir !== 'UP') nextSnakeDir = 'DOWN';
    if (dir === 'LEFT' && snakeDir !== 'RIGHT') nextSnakeDir = 'LEFT';
    if (dir === 'RIGHT' && snakeDir !== 'LEFT') nextSnakeDir = 'RIGHT';
}

window.addEventListener('keydown', e => {
    if (!document.getElementById('snakegame-container').classList.contains('active') || isGamePaused) return;
    if (e.code === 'ArrowUp') { e.preventDefault(); changeSnakeDir('UP'); }
    if (e.code === 'ArrowDown') { e.preventDefault(); changeSnakeDir('DOWN'); }
    if (e.code === 'ArrowLeft') { e.preventDefault(); changeSnakeDir('LEFT'); }
    if (e.code === 'ArrowRight') { e.preventDefault(); changeSnakeDir('RIGHT'); }
});

function spawnSnakeParticles(gx, gy, color) {
    for (let i = 0; i < 12; i++) {
        snakeParticles.push({
            x: gx * 10 + 5,
            y: gy * 10 + 5,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 18,
            color
        });
    }
}

function updateRealSnake() {
    if (isGamePaused) return;
    snakeDir = nextSnakeDir;
    let head = { x: snake[0].x, y: snake[0].y };

    if (snakeDir === 'UP') head.y--;
    if (snakeDir === 'DOWN') head.y++;
    if (snakeDir === 'LEFT') head.x--;
    if (snakeDir === 'RIGHT') head.x++;

    if (snakeComboTimer > 0) snakeComboTimer--;
    else snakeCombo = 1;

    if (snakeGhostTimer > 0) {
        snakeGhostTimer--;
        if (head.x < 0) head.x = 25;
        if (head.x >= 26) head.x = 0;
        if (head.y < 0) head.y = 25;
        if (head.y >= 26) head.y = 0;
    }

    const hitWall = head.x < 0 || head.x >= 26 || head.y < 0 || head.y >= 26;
    const hitSelf = snakeGhostTimer <= 0 && snake.some(s => s.x === head.x && s.y === head.y);

    if (hitWall || hitSelf) {
        audio.playSFX('gameover');
        clearInterval(snakeInterval);
        document.getElementById('snake-final-msg').textContent = `Final Score: ${snakeScore}`;
        document.getElementById('snake-gameover-overlay').style.display = 'flex';
        let stats = ScoreManager.saveScore('snake', snakeScore);
        submitScore('Cyber Snake', 'Player', snakeScore);
        document.getElementById('snake-high').textContent = stats.highScore;
        return;
    }

    snake.unshift(head);

    if (head.x === snakeFood.x && head.y === snakeFood.y) {
        audio.playSFX('score');
        snakeScore += 10 * snakeCombo;
        snakeCombo = Math.min(5, snakeCombo + 1);
        snakeComboTimer = 35;
        document.getElementById('snake-score').textContent = snakeScore;
        document.getElementById('snake-speed-lvl').textContent = `${snakeCombo}x`;
        spawnSnakeParticles(head.x, head.y, '#ec4899');
        spawnRealSnakeFood();
    } else {
        snake.pop();
    }

    if (snakeBonus) {
        snakeBonus.ttl--;
        if (head.x === snakeBonus.x && head.y === snakeBonus.y) {
            audio.playSFX('powerup');
            if (snakeBonus.type === 'gold') {
                snakeScore += 50;
                spawnSnakeParticles(head.x, head.y, '#facc15');
            } else {
                snakeGhostTimer = 50;
                spawnSnakeParticles(head.x, head.y, '#38bdf8');
            }
            document.getElementById('snake-score').textContent = snakeScore;
            snakeBonus = null;
        } else if (snakeBonus.ttl <= 0) {
            snakeBonus = null;
        }
    }

    drawRealSnake();
}

function drawRealSnake() {
    snakeCtx.fillStyle = '#070b14';
    snakeCtx.fillRect(0, 0, 260, 260);

    snakeCtx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    snakeCtx.lineWidth = 1;
    for (let i = 0; i <= 260; i += 20) {
        snakeCtx.beginPath(); snakeCtx.moveTo(i, 0); snakeCtx.lineTo(i, 260); snakeCtx.stroke();
        snakeCtx.beginPath(); snakeCtx.moveTo(0, i); snakeCtx.lineTo(260, i); snakeCtx.stroke();
    }

    snakeCtx.shadowColor = '#ec4899';
    snakeCtx.shadowBlur = 10;
    snakeCtx.fillStyle = '#ec4899';
    snakeCtx.beginPath();
    snakeCtx.arc(snakeFood.x * 10 + 5, snakeFood.y * 10 + 5, 4.5, 0, Math.PI * 2);
    snakeCtx.fill();

    if (snakeBonus) {
        snakeCtx.shadowColor = snakeBonus.type === 'gold' ? '#facc15' : '#38bdf8';
        snakeCtx.fillStyle = snakeCtx.shadowColor;
        snakeCtx.beginPath();
        snakeCtx.arc(snakeBonus.x * 10 + 5, snakeBonus.y * 10 + 5, 5.5, 0, Math.PI * 2);
        snakeCtx.fill();
    }
    snakeCtx.shadowBlur = 0;

    snake.forEach((part, idx) => {
        if (snakeGhostTimer > 0) {
            snakeCtx.fillStyle = idx === 0 ? '#38bdf8' : 'rgba(56, 189, 248, 0.45)';
        } else {
            snakeCtx.fillStyle = idx === 0 ? '#34d399' : '#059669';
        }
        let sz = idx === 0 ? 9 : 8;
        snakeCtx.beginPath();
        snakeCtx.roundRect(part.x * 10 + 1, part.y * 10 + 1, sz, sz, 3);
        snakeCtx.fill();
    });

    snakeParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        snakeCtx.fillStyle = p.color;
        snakeCtx.fillRect(p.x, p.y, 2.5, 2.5);
    });
    snakeParticles = snakeParticles.filter(p => p.life > 0);
}

// ===================================================
// BRICK BREAKER ENGINE
// ===================================================
let frostCanvas, frostCtx, frostRunning = false, frostAnimId, frostScore = 0, frostLives = 3, frostLvl = 1;
let frostPaddle = { x: 140, y: 315, width: 80, height: 10 }, frostBalls = [], frostBricks = [], frostPowerUps = [];

function initFrostCanvas() {
    frostCanvas = document.getElementById('frost-canvas'); 
    if (frostCanvas) {
        frostCtx = frostCanvas.getContext('2d');
        frostCanvas.onmousemove = (e) => {
            if (!frostRunning || isGamePaused) return;
            let rect = frostCanvas.getBoundingClientRect();
            let cx = (e.clientX - rect.left) * (frostCanvas.width / rect.width);
            frostPaddle.x = Math.max(0, Math.min(360 - frostPaddle.width, cx - frostPaddle.width / 2));
        };
        frostCanvas.ontouchmove = (e) => {
            if (!frostRunning || isGamePaused) return;
            let rect = frostCanvas.getBoundingClientRect();
            let touch = e.touches[0];
            let cx = (touch.clientX - rect.left) * (frostCanvas.width / rect.width);
            frostPaddle.x = Math.max(0, Math.min(360 - frostPaddle.width, cx - frostPaddle.width / 2));
            e.preventDefault();
        };
    }
}

function startFrostGame() {
    audio.playSFX('click'); 
    document.getElementById('frost-gameover-overlay').style.display = 'none'; 
    initFrostCanvas(); 
    if (!frostCtx) return;

    frostRunning = true; 
    frostScore = 0; 
    frostLives = 3; 
    frostLvl = 1; 
    frostPaddle = { x: 140, y: 315, width: 80, height: 10 };
    frostPowerUps = [];
    initFrostBalls();
    buildFrostBricks();
    updateFrostHUD();

    cancelAnimationFrame(frostAnimId);
    frostLoop();
}

function initFrostBalls() { 
    frostBalls = [{ x: 180, y: 180, vx: 3, vy: -3.5, radius: 6, active: true }]; 
}

function buildFrostBricks() {
    frostBricks = [];
    const rows = 4, cols = 8, width = 38, height = 16, padding = 4, offsetTop = 35, offsetLeft = 12;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            frostBricks.push({ x: offsetLeft + c * (width + padding), y: offsetTop + r * (height + padding), width, height, status: 1 });
        }
    }
}

function updateFrostHUD() {
    document.getElementById('frost-score').textContent = String(frostScore).padStart(6, '0');
    document.getElementById('frost-lvl').textContent = `LVL ${frostLvl}`;
    document.getElementById('frost-lives').textContent = frostLives;
}

function frostLoop() {
    if (!frostRunning) return; 
    if (isGamePaused) {
        frostAnimId = requestAnimationFrame(frostLoop);
        return;
    }
    frostCtx.fillStyle = '#080d1a'; 
    frostCtx.fillRect(0, 0, 360, 340);

    let activeBricks = 0; 
    frostBricks.forEach(b => {
        if (b.status > 0) {
            activeBricks++;
            frostCtx.fillStyle = '#8b5cf6';
            frostCtx.fillRect(b.x, b.y, b.width, b.height);
        }
    });

    if (activeBricks === 0) {
        frostLvl++; 
        audio.playSFX('win'); 
        buildFrostBricks(); 
        frostBalls = [{ x: 180, y: 180, vx: 3, vy: -3.5, radius: 6, active: true }];
        updateFrostHUD();
    }

    frostCtx.fillStyle = '#38bdf8'; 
    frostCtx.fillRect(frostPaddle.x, frostPaddle.y, frostPaddle.width, frostPaddle.height);

    frostPowerUps.forEach(p => {
        p.y += 2.5;
        frostCtx.fillStyle = p.type === 'x3' ? '#10b981' : p.type === 'longer' ? '#38bdf8' : p.type === 'shorter' ? '#f59e0b' : '#ef4444';
        frostCtx.beginPath();
        frostCtx.roundRect(p.x, p.y, 22, 22, 6);
        frostCtx.fill();
        frostCtx.fillStyle = '#ffffff';
        frostCtx.font = 'bold 10px sans-serif';
        frostCtx.fillText(p.label, p.x + 3, p.y + 15);

        if (p.y + 22 >= frostPaddle.y && p.x + 22 >= frostPaddle.x && p.x <= frostPaddle.x + frostPaddle.width) {
            p.collected = true;
            audio.playSFX('powerup');
            if (p.type === 'x3' && frostBalls.length > 0) {
                let refB = frostBalls[0];
                frostBalls.push({ x: refB.x, y: refB.y, vx: -refB.vx, vy: refB.vy, radius: 6, active: true });
                frostBalls.push({ x: refB.x, y: refB.y, vx: refB.vx * 0.8, vy: refB.vy * 1.1, radius: 6, active: true });
            } else if (p.type === 'longer') {
                frostPaddle.width = Math.min(130, frostPaddle.width + 25);
            } else if (p.type === 'shorter') {
                frostPaddle.width = Math.max(50, frostPaddle.width - 20);
            } else if (p.type === 'reducer') {
                frostLives = Math.max(1, frostLives - 1);
                updateFrostHUD();
            }
        }
    });
    frostPowerUps = frostPowerUps.filter(p => p.y < 340 && !p.collected);

    frostBalls.forEach(ball => {
        if (!ball.active) return;
        ball.x += ball.vx; 
        ball.y += ball.vy;

        if (ball.x - ball.radius < 0 || ball.x + ball.radius > 360) { ball.vx *= -1; audio.playSFX('move'); }
        if (ball.y - ball.radius < 0) { ball.vy *= -1; audio.playSFX('move'); }

        if (ball.y + ball.radius >= frostPaddle.y && ball.x >= frostPaddle.x && ball.x <= frostPaddle.x + frostPaddle.width) {
            ball.vy *= -1; 
            audio.playSFX('click');
        }

        frostBricks.forEach(b => {
            if (b.status > 0 && ball.x > b.x && ball.x < b.x + b.width && ball.y > b.y && ball.y < b.y + b.height) {
                ball.vy *= -1; 
                b.status = 0; 
                frostScore += 15;
                audio.playSFX('score'); 
                updateFrostHUD();

                if (Math.random() < 0.28) {
                    let types = [
                        { type: 'x3', label: 'x3' },
                        { type: 'longer', label: 'L+' },
                        { type: 'shorter', label: 'S-' },
                        { type: 'reducer', label: '-HP' }
                    ];
                    let chosen = types[Math.floor(Math.random() * types.length)];
                    frostPowerUps.push({ x: b.x + b.width/2 - 11, y: b.y, type: chosen.type, label: chosen.label, collected: false });
                }
            }
        });

        if (ball.y > 340) ball.active = false;

        frostCtx.fillStyle = '#ffffff'; 
        frostCtx.beginPath(); 
        frostCtx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); 
        frostCtx.fill();
    });

    frostBalls = frostBalls.filter(b => b.active);
    if (frostBalls.length === 0) {
        frostLives--; 
        audio.playSFX('gameover'); 
        updateFrostHUD();
        if (frostLives <= 0) {
            frostRunning = false;
            document.getElementById('final-frost-score').textContent = `Final Score: ${frostScore}`;
            document.getElementById('frost-gameover-overlay').style.display = 'flex';
            ScoreManager.saveScore('brickbreaker', frostScore);
            submitScore('Brick Breaker', 'TestPlayer', frostScore);
            return;
        } else {
            initFrostBalls();
        }
    }
    if (frostRunning) frostAnimId = requestAnimationFrame(frostLoop);
}

// ===================================================
// STICK RUN - CLASSIC ENDLESS RUN ENGINE
// ===================================================
let srCanvas, srCtx, srRunning = false, srAnimId;
let srScore = 0, srCoins = 0, srSpeed = 6, srHighScore = Number(localStorage.getItem('sr_high')) || 0;
let srPlayer = { x: 100, y: 310, w: 28, h: 56, vy: 0, grounded: true, doubleJumpAvailable: true, sliding: false, slideTimer: 0, frame: 0 };
let srObstacles = [], srCrates = [], deathAnim = null;
let srBgMusicInterval = null;

function startStickRunGame() {
    audio.playSFX('click');
    document.getElementById('sr-main-menu').style.display = 'none';
    document.getElementById('sr-gameplay-screen').style.display = 'flex';
    initSrGame();
}

function returnToSrMenu() {
    audio.playSFX('click');
    srRunning = false;
    cancelAnimationFrame(srAnimId);
    if(srBgMusicInterval) clearInterval(srBgMusicInterval);
    document.getElementById('sr-gameplay-screen').style.display = 'none';
    document.getElementById('sr-main-menu').style.display = 'flex';
    document.getElementById('sr-hub-high').textContent = srHighScore;
    document.getElementById('sr-hub-coins').textContent = srCoins;
}

function initSrGame() {
    srCanvas = document.getElementById('sr-canvas');
    if(srCanvas) srCtx = srCanvas.getContext('2d');
    srRunning = true;
    srScore = 0;
    srCoins = 0;
    srSpeed = 6;
    srObstacles = [];
    srCrates = [];
    deathAnim = null;
    srPlayer.y = 310;
    srPlayer.vy = 0;
    srPlayer.grounded = true;
    srPlayer.doubleJumpAvailable = true;
    srPlayer.sliding = false;

    document.getElementById('sr-score').textContent = 0;
    document.getElementById('sr-coins-val').textContent = 0;
    document.getElementById('sr-best-val').textContent = srHighScore;

    playSrThemeMusic();
    cancelAnimationFrame(srAnimId);
    srGameLoop();
}

function playSrThemeMusic() {
    if(srBgMusicInterval) clearInterval(srBgMusicInterval);
    const notes = [330, 392, 440, 523, 587, 523, 440, 392];
    let idx = 0;
    srBgMusicInterval = setInterval(() => {
        if(!srRunning || isGamePaused) return;
        audio.playTone(notes[idx % notes.length], 0.12, 'triangle');
        idx++;
    }, 220);
}

function srJump() {
    if(!srRunning || deathAnim || isGamePaused) return;
    if(srPlayer.grounded) {
        srPlayer.vy = -12.5;
        srPlayer.grounded = false;
        srPlayer.doubleJumpAvailable = true;
        srPlayer.sliding = false;
        audio.playSFX('move');
    } else if(srPlayer.doubleJumpAvailable) {
        srPlayer.vy = -11.0;
        srPlayer.doubleJumpAvailable = false;
        audio.playSFX('powerup');
    }
}

function srSlide() {
    if(!srPlayer.grounded || srPlayer.sliding || !srRunning || deathAnim || isGamePaused) return;
    srPlayer.sliding = true;
    srPlayer.slideTimer = 30;
    audio.playSFX('click');
}

const jumpBtnEl = document.getElementById('sr-jump-btn');
const slideBtnEl = document.getElementById('sr-slide-btn');
if(jumpBtnEl) jumpBtnEl.onclick = srJump;
if(slideBtnEl) slideBtnEl.onclick = srSlide;

window.addEventListener('keydown', e => {
    if(!document.getElementById('stickman-container').classList.contains('active') || isGamePaused) return;
    if(e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); srJump(); }
    if(e.code === 'ArrowDown') { e.preventDefault(); srSlide(); }
});

let spawnTimer = 0;
function srGameLoop() {
    if(!srRunning) return;
    if(isGamePaused) {
        srAnimId = requestAnimationFrame(srGameLoop);
        return;
    }

    let grad = srCtx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, '#ffbb44');
    grad.addColorStop(0.7, '#ff8822');
    grad.addColorStop(1, '#dd6611');
    srCtx.fillStyle = grad;
    srCtx.fillRect(0, 0, 800, 400);

    srCtx.fillStyle = '#b0b0b0';
    srCtx.fillRect(0, 366, 800, 34);
    srCtx.fillStyle = '#888888';
    for(let i = -40; i < 850; i += 40) {
        srCtx.beginPath();
        srCtx.moveTo(i + (srScore * srSpeed) % 40, 366);
        srCtx.lineTo(i + 20 + (srScore * srSpeed) % 40, 366);
        srCtx.lineTo(i - 15 + (srScore * srSpeed) % 40, 400);
        srCtx.lineTo(i - 35 + (srScore * srSpeed) % 40, 400);
        srCtx.closePath();
        srCtx.fill();
    }

    srCrates.forEach(c => {
        srCtx.fillStyle = '#facc15';
        srCtx.beginPath(); srCtx.arc(c.x, c.y, 11, 0, Math.PI*2); srCtx.fill();
        srCtx.strokeStyle = '#ca8a04'; srCtx.lineWidth = 2; srCtx.stroke();
        srCtx.fillStyle = '#713f12'; srCtx.font = 'bold 12px sans-serif'; srCtx.fillText('$', c.x - 4, c.y + 4);
    });

    srObstacles.forEach(o => {
        if(o.type === 'crate' || o.type === 'double_crate') {
            srCtx.fillStyle = '#b47535';
            srCtx.fillRect(o.x, 310, o.w, 56);
            srCtx.strokeStyle = '#6e441a'; srCtx.lineWidth = 3;
            srCtx.strokeRect(o.x, 310, o.w, 56);
            srCtx.beginPath();
            srCtx.moveTo(o.x, 310); srCtx.lineTo(o.x + o.w, 366);
            srCtx.moveTo(o.x + o.w, 310); srCtx.lineTo(o.x, 366);
            srCtx.stroke();

            if(o.type === 'double_crate') {
                srCtx.fillStyle = '#b47535';
                srCtx.fillRect(o.x, 254, o.w, 56);
                srCtx.strokeRect(o.x, 254, o.w, 56);
                srCtx.beginPath();
                srCtx.moveTo(o.x, 254); srCtx.lineTo(o.x + o.w, 310);
                srCtx.moveTo(o.x + o.w, 254); srCtx.lineTo(o.x, 310);
                srCtx.stroke();
            }
        } else {
            srCtx.save();
            srCtx.translate(o.x + o.w/2, o.y + o.h/2);
            srCtx.rotate(o.rotation);
            srCtx.fillStyle = '#94a3b8';
            srCtx.beginPath(); srCtx.arc(0, 0, 18, 0, Math.PI*2); srCtx.fill();
            srCtx.strokeStyle = '#334155'; srCtx.lineWidth = 3; srCtx.stroke();
            for(let s=0; s<8; s++) {
                srCtx.rotate(Math.PI / 4);
                srCtx.fillStyle = '#cbd5e1';
                srCtx.fillRect(-3, -24, 6, 6);
            }
            srCtx.restore();
            o.rotation += 0.25;
        }
    });

    if(!deathAnim) {
        srPlayer.y += srPlayer.vy;
        srPlayer.vy += 0.65;
        if(srPlayer.y >= 310) {
            srPlayer.y = 310;
            srPlayer.vy = 0;
            srPlayer.grounded = true;
            srPlayer.doubleJumpAvailable = true;
        }

        if(srPlayer.sliding) {
            srPlayer.slideTimer--;
            if(srPlayer.slideTimer <= 0) srPlayer.sliding = false;
        }

        srPlayer.frame += 0.35;
        drawSrStickman(srCtx, srPlayer.x, srPlayer.y, srPlayer.sliding, srPlayer.frame);

        spawnTimer++;
        let minSpawnGap = Math.max(40, 75 - Math.floor(srSpeed * 2));
        if(spawnTimer > minSpawnGap) {
            spawnTimer = 0;
            let rand = Math.random();
            if(rand < 0.32) {
                srObstacles.push({ x: 820, y: 310, w: 56, h: 56, type: 'crate' });
            } else if(rand < 0.60) {
                srObstacles.push({ x: 820, y: 254, w: 56, h: 112, type: 'double_crate' });
            } else {
                srObstacles.push({ x: 820, y: 272, w: 36, h: 36, type: 'saw', rotation: 0 });
            }
            if(Math.random() < 0.5) {
                srCrates.push({ x: 845, y: Math.random() < 0.5 ? 230 : 320 });
            }
        }

        srObstacles.forEach(o => o.x -= srSpeed);
        srCrates.forEach(c => c.x -= srSpeed);

        srCrates = srCrates.filter(c => {
            if(Math.abs(c.x - srPlayer.x) < 35 && Math.abs(c.y - (srPlayer.y + 25)) < 35) {
                audio.playSFX('score');
                srCoins++;
                document.getElementById('sr-coins-val').textContent = srCoins;
                return false;
            }
            return c.x > -20;
        });

        let pBox = srPlayer.sliding
            ? { x: srPlayer.x - 10, y: srPlayer.y + 32, w: 36, h: 24 }
            : { x: srPlayer.x - 8, y: srPlayer.y + 4, w: 22, h: 50 };

        for(let o of srObstacles) {
            let oBox = { x: o.x + 5, y: o.y + 5, w: o.w - 10, h: o.h - 10 };
            if(pBox.x < oBox.x + oBox.w && pBox.x + pBox.w > oBox.x &&
               pBox.y < oBox.y + oBox.h && pBox.y + pBox.h > oBox.y) {
                triggerSrDeath(o.type);
                break;
            }
        }

        srObstacles = srObstacles.filter(o => o.x > -60);
        srScore++;
        srSpeed = Math.min(12.5, 6 + Math.floor(srScore / 350) * 0.4);
        document.getElementById('sr-score').textContent = Math.floor(srScore / 5);
    } else {
        drawSrDeathAnimation();
    }

    srAnimId = requestAnimationFrame(srGameLoop);
}

function drawSrStickman(ctx, x, y, sliding, frame) {
    ctx.strokeStyle = '#0a0f19';
    ctx.fillStyle = '#0a0f19';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    if(sliding) {
        ctx.beginPath(); ctx.arc(x - 12, y + 40, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 5, y + 42); ctx.lineTo(x + 25, y + 48); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 25, y + 48); ctx.lineTo(x + 42, y + 44); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.arc(x + 4, y + 6, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 4, y + 14); ctx.lineTo(x, y + 36); ctx.stroke();

        let legAngle = Math.sin(frame) * 0.7;
        ctx.beginPath(); ctx.moveTo(x, y + 36); ctx.lineTo(x + Math.sin(legAngle) * 16, y + 54); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + 36); ctx.lineTo(x - Math.sin(legAngle) * 16, y + 54); ctx.stroke();

        ctx.beginPath(); ctx.moveTo(x + 2, y + 20); ctx.lineTo(x - Math.sin(legAngle) * 14, y + 32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 2, y + 20); ctx.lineTo(x + Math.sin(legAngle) * 14, y + 32); ctx.stroke();
    }
}

function triggerSrDeath(type) {
    audio.playSFX('gameover');
    if(srBgMusicInterval) clearInterval(srBgMusicInterval);
    let finalSc = Math.floor(srScore / 5);
    if(finalSc > srHighScore) {
        srHighScore = finalSc;
        localStorage.setItem('sr_high', srHighScore);
        document.getElementById('sr-best-val').textContent = srHighScore;
    }
    ScoreManager.saveScore('sr', finalSc);
    submitScore('Stick Run', 'TestPlayer', finalSc);

    deathAnim = { type, timer: 0, particles: [] };
    for(let i = 0; i < 18; i++) {
        deathAnim.particles.push({
            x: srPlayer.x,
            y: srPlayer.y + 25,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.7) * 9,
            color: i % 2 === 0 ? '#ef4444' : '#0a0f19'
        });
    }
}

function drawSrDeathAnimation() {
    deathAnim.timer++;
    deathAnim.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        srCtx.fillStyle = p.color;
        srCtx.beginPath(); srCtx.arc(p.x, p.y, 4, 0, Math.PI * 2); srCtx.fill();
    });

    if(deathAnim.timer > 55) {
        srCtx.fillStyle = 'rgba(0,0,0,0.85)';
        srCtx.fillRect(0, 0, 800, 400);
        srCtx.fillStyle = '#ef4444';
        srCtx.font = 'bold 42px sans-serif';
        srCtx.textAlign = 'center';
        srCtx.fillText('WIPEOUT!', 400, 175);
        srCtx.fillStyle = '#ffffff';
        srCtx.font = 'bold 20px sans-serif';
        srCtx.fillText(`FINAL SCORE: ${Math.floor(srScore / 5)}`, 400, 215);
        srCtx.fillStyle = '#facc15';
        srCtx.fillText('TAP SCREEN TO RETRY', 400, 255);
        srCtx.textAlign = 'left';

        srCanvas.onclick = () => {
            if(deathAnim && deathAnim.timer > 55) {
                srCanvas.onclick = null;
                initSrGame();
            }
        };
    }
}

// ===================================================
// TOWER STACK (FULL VERSION ENGINE)
// ===================================================
let tsCanvas, tsCtx, tsRunning = false, tsAnimId;
let tsBlocks = [], tsDebris = [], tsCurrentBlock = null, tsScore = 0, tsCombo = 0, tsCameraY = 0;
const TS_BLOCK_HEIGHT = 24;

function initTowerStackCanvas() {
    tsCanvas = document.getElementById('ts-canvas');
    if (!tsCanvas) return;
    tsCtx = tsCanvas.getContext('2d');
    tsCanvas.onpointerdown = (e) => {
        e.preventDefault();
        dropTowerBlock();
    };
}

function startTowerStackGame() {
    audio.playSFX('click');
    document.getElementById('ts-gameover-overlay').style.display = 'none';
    initTowerStackCanvas();
    if (!tsCtx) return;
    cancelAnimationFrame(tsAnimId);

    tsScore = 0;
    tsCombo = 0;
    tsCameraY = 0;
    tsDebris = [];
    tsRunning = true;

    tsBlocks = [{ x: 75, y: 360, w: 150, hue: 260 }];
    spawnNextTowerBlock();

    document.getElementById('ts-score').textContent = 0;
    document.getElementById('ts-combo').textContent = '0x';
    document.getElementById('ts-high').textContent = ScoreManager.getStats('towerstack').highScore;

    tsLoop();
}

function spawnNextTowerBlock() {
    const prev = tsBlocks[tsBlocks.length - 1];
    const hue = (prev.hue + 14) % 360;
    const speed = Math.min(6.5, 2.6 + tsScore * 0.12);
    const fromLeft = tsBlocks.length % 2 === 1;
    tsCurrentBlock = {
        x: fromLeft ? 0 : 300 - prev.w,
        y: prev.y - TS_BLOCK_HEIGHT,
        w: prev.w,
        vx: fromLeft ? speed : -speed,
        hue
    };
}

function dropTowerBlock() {
    if (!tsRunning || !tsCurrentBlock || isGamePaused) return;
    const prev = tsBlocks[tsBlocks.length - 1];
    const diff = tsCurrentBlock.x - prev.x;

    if (Math.abs(diff) >= prev.w) {
        tsDebris.push({ x: tsCurrentBlock.x, y: tsCurrentBlock.y, w: tsCurrentBlock.w, vy: 2, hue: tsCurrentBlock.hue });
        tsRunning = false;
        audio.playSFX('gameover');
        document.getElementById('ts-final-msg').textContent = `Blocks Stacked: ${tsScore}`;
        document.getElementById('ts-gameover-overlay').style.display = 'flex';
        const stats = ScoreManager.saveScore('towerstack', tsScore);
        submitScore('Tower Stack', 'Player', tsScore);
        document.getElementById('ts-high').textContent = stats.highScore;
        return;
    }

    if (Math.abs(diff) <= 5) {
        tsCurrentBlock.x = prev.x;
        tsCombo++;
        audio.playSFX('powerup');
        if (tsCombo >= 3) {
            tsCurrentBlock.w = Math.min(165, tsCurrentBlock.w + 10);
        }
    } else {
        tsCombo = 0;
        audio.playSFX('score');
        const overlapW = prev.w - Math.abs(diff);
        if (diff > 0) {
            tsDebris.push({ x: prev.x + prev.w, y: tsCurrentBlock.y, w: diff, vy: 1, hue: tsCurrentBlock.hue });
            tsCurrentBlock.w = overlapW;
        } else {
            tsDebris.push({ x: tsCurrentBlock.x, y: tsCurrentBlock.y, w: Math.abs(diff), vy: 1, hue: tsCurrentBlock.hue });
            tsCurrentBlock.x = prev.x;
            tsCurrentBlock.w = overlapW;
        }
    }

    tsBlocks.push({ x: tsCurrentBlock.x, y: tsCurrentBlock.y, w: tsCurrentBlock.w, hue: tsCurrentBlock.hue });
    tsScore++;
    document.getElementById('ts-score').textContent = tsScore;
    document.getElementById('ts-combo').textContent = `${tsCombo}x`;

    if (tsBlocks.length > 8) {
        tsCameraY += TS_BLOCK_HEIGHT;
    }
    spawnNextTowerBlock();
}

window.addEventListener('keydown', e => {
    if (!document.getElementById('towerstack-container')?.classList.contains('active') || isGamePaused) return;
    if (e.code === 'Space') {
        e.preventDefault();
        dropTowerBlock();
    }
});

function tsLoop() {
    if (!tsRunning && tsDebris.length === 0) return;
    if (isGamePaused) {
        tsAnimId = requestAnimationFrame(tsLoop);
        return;
    }

    tsCtx.fillStyle = '#090d16';
    tsCtx.fillRect(0, 0, 300, 400);

    if (tsRunning && tsCurrentBlock) {
        tsCurrentBlock.x += tsCurrentBlock.vx;
        if (tsCurrentBlock.x <= 0) {
            tsCurrentBlock.x = 0;
            tsCurrentBlock.vx *= -1;
        } else if (tsCurrentBlock.x + tsCurrentBlock.w >= 300) {
            tsCurrentBlock.x = 300 - tsCurrentBlock.w;
            tsCurrentBlock.vx *= -1;
        }
    }

    tsCtx.save();
    tsCtx.translate(0, tsCameraY);

    tsBlocks.forEach(b => {
        tsCtx.fillStyle = `hsl(${b.hue}, 78%, 58%)`;
        tsCtx.beginPath();
        tsCtx.roundRect(b.x, b.y, b.w, TS_BLOCK_HEIGHT - 2, 4);
        tsCtx.fill();
    });

    if (tsRunning && tsCurrentBlock) {
        tsCtx.fillStyle = `hsl(${tsCurrentBlock.hue}, 85%, 65%)`;
        tsCtx.beginPath();
        tsCtx.roundRect(tsCurrentBlock.x, tsCurrentBlock.y, tsCurrentBlock.w, TS_BLOCK_HEIGHT - 2, 4);
        tsCtx.fill();
    }

    tsDebris.forEach(d => {
        d.y += d.vy;
        d.vy += 0.45;
        tsCtx.fillStyle = `hsla(${d.hue}, 70%, 50%, 0.7)`;
        tsCtx.fillRect(d.x, d.y, d.w, TS_BLOCK_HEIGHT - 2);
    });
    tsDebris = tsDebris.filter(d => d.y - tsCameraY < 430);

    tsCtx.restore();
    tsAnimId = requestAnimationFrame(tsLoop);
}

// ===================================================
// PINOY DAMA ENGINE (With Multi-Jump Chaining & Setup)
// ===================================================
let damaBoard = []; 
let damaTurn = 'r';
let damaSelected = null;
let damaValidMoves = [];
let damaMode = 'pvp';       
let damaDifficulty = 'normal'; 
let damaGameOver = false;
let damaChainingPiece = null; // Tracks a piece currently in the middle of a jump chain

function newDamaGame() {
    // Show setup screen first, hide active game screen
    const setupScreen = document.getElementById('dama-setup-screen');
    const gameScreen = document.getElementById('dama-game-screen');
    if (setupScreen) {
        setupScreen.style.display = 'flex';
        setupScreen.classList.add('active');
    }
    if (gameScreen) {
        gameScreen.style.display = 'none';
        gameScreen.classList.remove('active');
    }
    setDamaSetupMode('pvp');
    setDamaSetupDiff('normal');
}

function setDamaSetupMode(mode) {
    audio.playSFX('click');
    damaMode = mode;
    document.getElementById('dama-setup-pvp')?.classList.toggle('active', mode === 'pvp');
    document.getElementById('dama-setup-ai')?.classList.toggle('active', mode === 'ai');
    
    const diffGroup = document.getElementById('dama-setup-diff-group');
    if (diffGroup) {
        diffGroup.style.display = (mode === 'ai') ? 'block' : 'none';
    }
}

function setDamaSetupDiff(diff) {
    audio.playSFX('click');
    damaDifficulty = diff;
    document.getElementById('dama-setup-normal')?.classList.toggle('active', diff === 'normal');
    document.getElementById('dama-setup-hard')?.classList.toggle('active', diff === 'hard');
}

function startDamaMatchFromSetup() {
    audio.playSFX('click');
    const setupScreen = document.getElementById('dama-setup-screen');
    const gameScreen = document.getElementById('dama-game-screen');
    if (setupScreen) {
        setupScreen.style.display = 'none';
        setupScreen.classList.remove('active');
    }
    if (gameScreen) {
        gameScreen.style.display = 'flex';
        gameScreen.classList.add('active');
    }
    initDamaBoard();
}

function backToDamaSetup() {
    audio.playSFX('click');
    const setupScreen = document.getElementById('dama-setup-screen');
    const gameScreen = document.getElementById('dama-game-screen');
    if (gameScreen) {
        gameScreen.style.display = 'none';
        gameScreen.classList.remove('active');
    }
    if (setupScreen) {
        setupScreen.style.display = 'flex';
        setupScreen.classList.add('active');
    }
}

function restartDamaMatch() {
    audio.playSFX('click');
    initDamaBoard();
}

function initDamaBoard() {
    damaTurn = 'r';
    damaSelected = null;
    damaValidMoves = [];
    damaGameOver = false;
    damaChainingPiece = null;

    damaBoard = Array(8).fill(null).map(() => Array(8).fill(null));

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) damaBoard[r][c] = 'b';
        }
    }
    for (let r = 5; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) damaBoard[r][c] = 'r';
        }
    }

    updateDamaStatus();
    renderDamaBoard();
}

function renderDamaBoard() {
    const boardEl = document.getElementById('dama-board');
    if (!boardEl) return;

    boardEl.style.display = 'grid';
    boardEl.style.gridTemplateColumns = 'repeat(8, minmax(0, 1fr))';
    boardEl.style.gridTemplateRows = 'repeat(8, minmax(0, 1fr))';
    boardEl.style.width = '100%';
    boardEl.style.maxWidth = '360px';
    boardEl.style.aspectRatio = '1';
    boardEl.style.margin = '0 auto';
    boardEl.style.border = '4px solid #1e293b';
    boardEl.style.borderRadius = '8px';
    boardEl.style.overflow = 'hidden';
    boardEl.innerHTML = '';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            const isDark = (r + c) % 2 === 1;
            cell.style.background = isDark ? '#334155' : '#cbd5e1';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.position = 'relative';
            cell.style.cursor = isDark ? 'pointer' : 'default';
            cell.style.width = '100%';
            cell.style.height = '100%';

            const piece = damaBoard[r][c];
            if (piece) {
                const pEl = document.createElement('div');
                pEl.style.width = '76%';
                pEl.style.height = '76%';
                pEl.style.borderRadius = '50%';
                pEl.style.display = 'flex';
                pEl.style.alignItems = 'center';
                pEl.style.justifyContent = 'center';
                pEl.style.fontSize = '1.1rem';
                pEl.style.boxShadow = '0 3px 6px rgba(0,0,0,0.4)';

                if (piece.toLowerCase() === 'r') {
                    pEl.style.background = 'radial-gradient(circle at 30% 30%, #f43f5e, #be123c)';
                } else {
                    pEl.style.background = 'radial-gradient(circle at 30% 30%, #38bdf8, #0369a1)';
                }

                if (piece === 'R' || piece === 'B') {
                    pEl.textContent = '👑';
                    pEl.style.border = '2.5px solid #facc15';
                }

                cell.appendChild(pEl);
            }

            if (damaSelected && damaSelected.r === r && damaSelected.c === c) {
                cell.style.boxShadow = 'inset 0 0 0 3px #facc15';
            }

            const validTarget = damaValidMoves.find(m => m.r === r && m.c === c);
            if (validTarget) {
                const dot = document.createElement('div');
                dot.style.width = '14px';
                dot.style.height = '14px';
                dot.style.borderRadius = '50%';
                dot.style.background = validTarget.jumped ? '#ef4444' : '#22c55e';
                dot.style.boxShadow = `0 0 8px ${validTarget.jumped ? '#ef4444' : '#22c55e'}`;
                cell.appendChild(dot);
            }

            cell.onclick = () => onDamaCellClick(r, c);
            boardEl.appendChild(cell);
        }
    }
}

function onDamaCellClick(r, c) {
    if (damaGameOver || isGamePaused) return;
    if (damaMode === 'ai' && damaTurn === 'b') return;

    const clickedPiece = damaBoard[r][c];

    // If a piece is currently chaining jumps, only that specific piece can be clicked/moved
    if (damaChainingPiece) {
        if (damaChainingPiece.r === r && damaChainingPiece.c === c) {
            return; // Already selected
        }
        const chosenMove = damaValidMoves.find(m => m.r === r && m.c === c);
        if (chosenMove && chosenMove.jumped) {
            applyDamaMove(damaSelected.r, damaSelected.c, chosenMove);
        }
        return;
    }

    if (clickedPiece && clickedPiece.toLowerCase() === damaTurn) {
        damaSelected = { r, c };
        damaValidMoves = getDamaValidMoves(r, c, damaTurn);
        audio.playSFX('click');
        renderDamaBoard();
        return;
    }

    const chosenMove = damaValidMoves.find(m => m.r === r && m.c === c);
    if (chosenMove && damaSelected) {
        applyDamaMove(damaSelected.r, damaSelected.c, chosenMove);
    }
}

function getDamaValidMoves(r, c, turnColor, onlyJumps = false) {
    const piece = damaBoard[r][c];
    if (!piece) return [];

    const moves = [];
    const isDama = (piece === 'R' || piece === 'B');
    const opponents = (turnColor === 'r') ? ['b', 'B'] : ['r', 'R'];

    if (!isDama) {
        if (!onlyJumps) {
            const forwardDirs = (piece === 'r') ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
            forwardDirs.forEach(([dr, dc]) => {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !damaBoard[nr][nc]) {
                    moves.push({ r: nr, c: nc, jumped: null });
                }
            });
        }

        const allDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        allDirs.forEach(([dr, dc]) => {
            const midR = r + dr, midC = c + dc;
            const landR = r + dr * 2, landC = c + dc * 2;
            if (landR >= 0 && landR < 8 && landC >= 0 && landC < 8) {
                if (opponents.includes(damaBoard[midR][midC]) && !damaBoard[landR][landC]) {
                    moves.push({ r: landR, c: landC, jumped: { r: midR, c: midC } });
                }
            }
        });
    } else {
        const allDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        allDirs.forEach(([dr, dc]) => {
            let step = 1;
            let enemyFound = null;

            while (true) {
                const nr = r + dr * step;
                const nc = c + dc * step;
                if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

                const cellContent = damaBoard[nr][nc];
                if (!cellContent) {
                    const isJump = enemyFound !== null;
                    if (!onlyJumps || isJump) {
                        moves.push({
                            r: nr,
                            c: nc,
                            jumped: enemyFound ? { r: enemyFound.r, c: enemyFound.c } : null
                        });
                    }
                } else if (opponents.includes(cellContent)) {
                    if (enemyFound) break; 
                    enemyFound = { r: nr, c: nc };
                } else {
                    break; 
                }
                step++;
            }
        });
    }

    return moves;
}

function applyDamaMove(fromR, fromC, move) {
    let piece = damaBoard[fromR][fromC];
    damaBoard[move.r][move.c] = piece;
    damaBoard[fromR][fromC] = null;

    let wasJump = move.jumped !== null;

    if (wasJump) {
        damaBoard[move.jumped.r][move.jumped.c] = null;
        audio.playSFX('score');
    } else {
        audio.playSFX('move');
    }

    // Crown promotion check
    if (piece === 'r' && move.r === 0) {
        piece = 'R';
        damaBoard[move.r][move.c] = 'R';
        audio.playSFX('powerup');
    } else if (piece === 'b' && move.r === 7) {
        piece = 'B';
        damaBoard[move.r][move.c] = 'B';
        audio.playSFX('powerup');
    }

    if (checkDamaWinner()) return;

    // Check for multi-jump chain opportunity if the move was a jump
    if (wasJump) {
        const furtherMoves = getDamaValidMoves(move.r, move.c, damaTurn, true).filter(m => m.jumped !== null);
        if (furtherMoves.length > 0) {
            // Chain continues with this exact piece!
            damaChainingPiece = { r: move.r, c: move.c };
            damaSelected = { r: move.r, c: move.c };
            damaValidMoves = furtherMoves;
            updateDamaStatus(true);
            renderDamaBoard();
            
            // If AI is chaining jumps
            if (damaMode === 'ai' && damaTurn === 'b' && !damaGameOver) {
                setTimeout(executeAiDamaTurn, 450);
            }
            return;
        }
    }

    // End of turn / switch turns
    damaChainingPiece = null;
    damaSelected = null;
    damaValidMoves = [];

    damaTurn = (damaTurn === 'r') ? 'b' : 'r';
    updateDamaStatus(false);
    renderDamaBoard();

    if (damaMode === 'ai' && damaTurn === 'b' && !damaGameOver) {
        setTimeout(executeAiDamaTurn, 450);
    }
}

function updateDamaStatus(isChaining = false) {
    if (damaGameOver) return;
    const statusEl = document.getElementById('dama-status');
    if (!statusEl) return;

    if (damaMode === 'ai') {
        if (isChaining) {
            statusEl.textContent = (damaTurn === 'r') ? "🔥 Multi-Jump Chain! Take another jump!" : "AI is continuing jump chain...";
        } else {
            statusEl.textContent = (damaTurn === 'r') ? "Your Turn (Red)" : "AI is thinking...";
        }
    } else {
        if (isChaining) {
            statusEl.textContent = (damaTurn === 'r') ? "🔴 Red Chain! Jump again!" : "🔵 Blue Chain! Jump again!";
        } else {
            statusEl.textContent = (damaTurn === 'r') ? "Red Player's Turn" : "Blue Player's Turn";
        }
    }
}

function checkDamaWinner() {
    let redPieces = 0, bluePieces = 0;
    let redCanMove = false, blueCanMove = false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = damaBoard[r][c];
            if (!p) continue;
            if (p.toLowerCase() === 'r') {
                redPieces++;
                if (getDamaValidMoves(r, c, 'r').length > 0) redCanMove = true;
            } else {
                bluePieces++;
                if (getDamaValidMoves(r, c, 'b').length > 0) blueCanMove = true;
            }
        }
    }

    const statusEl = document.getElementById('dama-status');
    if (redPieces === 0 || !redCanMove) {
        damaGameOver = true;
        renderDamaBoard();
        audio.playSFX('gameover');
        if (statusEl) statusEl.textContent = (damaMode === 'ai') ? "🤖 AI Wins the Match!" : "🔵 Blue Wins! 🎉";
        return true;
    }
    if (bluePieces === 0 || !blueCanMove) {
        damaGameOver = true;
        renderDamaBoard();
        audio.playSFX('win');
        if (statusEl) statusEl.textContent = (damaMode === 'ai') ? "🎉 You Defeated AI!" : "🔴 Red Wins! 🎉";
        ScoreManager.saveScore('dama', 100);
        submitScore('Dama', 'Player', 100);
        return true;
    }
    return false;
}

function executeAiDamaTurn() {
    if (damaGameOver || isGamePaused) return;

    let candidateMoves = [];

    // If AI is in the middle of a jump chain, restrict moves only to the chaining piece
    if (damaChainingPiece) {
        const moves = getDamaValidMoves(damaChainingPiece.r, damaChainingPiece.c, 'b', true).filter(m => m.jumped !== null);
        moves.forEach(m => candidateMoves.push({ fromR: damaChainingPiece.r, fromC: damaChainingPiece.c, move: m }));
    } else {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = damaBoard[r][c];
                if (p && p.toLowerCase() === 'b') {
                    const moves = getDamaValidMoves(r, c, 'b');
                    moves.forEach(m => candidateMoves.push({ fromR: r, fromC: c, move: m }));
                }
            }
        }
    }

    if (candidateMoves.length === 0) return;

    let selectedOption;

    if (damaDifficulty === 'normal') {
        const captures = candidateMoves.filter(item => item.move.jumped !== null);
        const pool = captures.length > 0 ? captures : candidateMoves;
        selectedOption = pool[Math.floor(Math.random() * pool.length)];
    } else {
        let bestScore = -9999;
        let bestMoves = [];

        candidateMoves.forEach(item => {
            let score = 0;
            if (item.move.jumped) score += 50;
            if (damaBoard[item.fromR][item.fromC] === 'b' && item.move.r === 7) score += 40;
            score += (item.move.r - item.fromR) * 3;
            if (item.move.c >= 2 && item.move.c <= 5) score += 5;

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [item];
            } else if (score === bestScore) {
                bestMoves.push(item);
            }
        });

        selectedOption = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    if (selectedOption) {
        applyDamaMove(selectedOption.fromR, selectedOption.fromC, selectedOption.move);
    }
}
