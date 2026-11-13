/* ==========================================================================
   Arcade Hub: Chess & Dama (Checkers) Strategy Board Game Module
   ================ ========================================================== */

const BOARD_SYMBOLS = {
    wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
    bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟'
};

// --- Game State Variables ---
let chessBoard = [], chessTurn = 'w', chessSelected = null, chessLegal = [], chessMode = 'normal', chessOver = false;
let damaBoard = [], damaTurn = 'w', damaSelected = null, damaMoves = [], damaChain = null, damaMode = 'normal', damaOver = false;

const cloneBoard = b => b.map(r => r.slice());

// --- Navigation & Setup Controls ---
function openBoardGame(which) {
    document.querySelector('header').style.display = 'none';
    document.getElementById('main-menu').classList.remove('active');
    document.querySelectorAll('.game-container').forEach(x => x.classList.remove('active'));
    document.getElementById(which + '-container').classList.add('active');
    if (which === 'chess') newChessGame();
    else newDamaGame();
}

function boardBack() {
    document.querySelectorAll('.game-container').forEach(x => x.classList.remove('active'));
    document.getElementById('main-menu').classList.add('active');
    document.querySelector('header').style.display = 'flex';
}

function setBoardDifficulty(game, v) {
    if (game === 'chess') { chessMode = v; newChessGame(); }
    else { damaMode = v; newDamaGame(); }
}


/* ==========================================================================
   CHESS ENGINE & LOGIC
   ========================================================================== */

function chessInitial() {
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
        b[0][c] = 'b' + back[c];
        b[1][c] = 'bp';
        b[6][c] = 'wp';
        b[7][c] = 'w' + back[c];
    }
    return b;
}

function newChessGame() {
    chessBoard = chessInitial();
    chessTurn = 'w';
    chessSelected = null;
    chessLegal = [];
    chessOver = false;
    const statusEl = document.getElementById('chess-status');
    if (statusEl) statusEl.textContent = 'Your turn — White';
    drawChess();
}

function inside(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function findKing(b, color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (b[r][c] === color + 'k') return [r, c];
        }
    }
    return null;
}

function attacked(b, r, c, by) {
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const p = b[y][x];
            if (!p || p[0] !== by) continue;
            const t = p[1], dr = r - y, dc = c - x;
            if (t === 'p' && Math.abs(dc) === 1 && dr === (by === 'w' ? -1 : 1)) return true;
            if (t === 'n' && Math.abs(dr) * Math.abs(dc) === 2) return true;
            if (t === 'k' && Math.max(Math.abs(dr), Math.abs(dc)) === 1) return true;
            if ('rbq'.includes(t)) {
                const straight = dr === 0 || dc === 0, diag = Math.abs(dr) === Math.abs(dc);
                if ((t === 'r' && straight) || (t === 'b' && diag) || (t === 'q' && (straight || diag))) {
                    const sr = Math.sign(dr), sc = Math.sign(dc);
                    let yy = y + sr, xx = x + sc, clear = true;
                    while (yy !== r || xx !== c) {
                        if (b[yy][xx]) { clear = false; break; }
                        yy += sr; xx += sc;
                    }
                    if (clear) return true;
                }
            }
        }
    }
    return false;
}

function pseudoChess(b, r, c) {
    const p = b[r][c];
    if (!p) return [];
    const color = p[0], t = p[1], out = [];
    const add = (y, x) => { if (inside(y, x) && (!b[y][x] || b[y][x][0] !== color)) out.push([y, x]); };
    
    if (t === 'p') {
        let d = color === 'w' ? -1 : 1;
        if (inside(r + d, c) && !b[r + d][c]) {
            out.push([r + d, c]);
            if ((color === 'w' ? r === 6 : r === 1) && !b[r + 2 * d][c]) out.push([r + 2 * d, c]);
        }
        for (let dc of [-1, 1]) {
            if (inside(r + d, c + dc) && b[r + d][c + dc] && b[r + d][c + dc][0] !== color) out.push([r + d, c + dc]);
        }
    } else if (t === 'n') {
        for (let [a, z] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r + a, c + z);
    } else if (t === 'k') {
        for (let a = -1; a <= 1; a++) for (let z = -1; z <= 1; z++) if (a || z) add(r + a, c + z);
    } else {
        const dirs = [];
        if (t !== 'b') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
        if (t !== 'r') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        for (const [a, z] of dirs) {
            let y = r + a, x = c + z;
            while (inside(y, x)) {
                if (!b[y][x]) out.push([y, x]);
                else { if (b[y][x][0] !== color) out.push([y, x]); break; }
                y += a; x += z;
            }
        }
    }
    return out;
}

function chessMoves(b, r, c) {
    const p = b[r][c];
    if (!p) return [];
    return pseudoChess(b, r, c).filter(([y, x]) => {
        const n = cloneBoard(b);
        n[y][x] = n[r][c];
        n[r][c] = null;
        if (n[y][x][1] === 'p' && (y === 0 || y === 7)) n[y][x] = n[y][x][0] + 'q';
        const k = findKing(n, p[0]);
        return k && !attacked(n, k[0], k[1], p[0] === 'w' ? 'b' : 'w');
    });
}

function allChessMoves(b, color) {
    const m = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (b[r][c]?.[0] === color) {
                for (const [y, x] of chessMoves(b, r, c)) m.push({ from: [r, c], to: [y, x] });
            }
        }
    }
    return m;
}

function applyChess(b, m) {
    const n = cloneBoard(b), p = n[m.from[0]][m.from[1]];
    n[m.to[0]][m.to[1]] = p;
    n[m.from[0]][m.from[1]] = null;
    if (p[1] === 'p' && (m.to[0] === 0 || m.to[0] === 7)) n[m.to[0]][m.to[1]] = p[0] + 'q';
    return n;
}

function chessValue(p) { return ({ p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 })[p[1]]; }

function evalChess(b) {
    let s = 0;
    for (let row of b) for (let p of row) if (p) s += (p[0] === 'b' ? 1 : -1) * chessValue(p);
    return s;
}

function minimaxChess(b, depth, alpha, beta, max) {
    const color = max ? 'b' : 'w', moves = allChessMoves(b, color);
    if (depth === 0 || !moves.length) return evalChess(b) + (moves.length ? 0 : (max ? -25000 : 25000));
    let best = max ? -Infinity : Infinity;
    for (const m of moves) {
        const v = minimaxChess(applyChess(b, m), depth - 1, alpha, beta, !max);
        if (max) { best = Math.max(best, v); alpha = Math.max(alpha, best); }
        else { best = Math.min(best, v); beta = Math.min(beta, best); }
        if (beta <= alpha) break;
    }
    return best;
}

function chessAI() {
    if (chessOver || chessTurn !== 'b') return;
    const moves = allChessMoves(chessBoard, 'b');
    if (!moves.length) { finishChess(); return; }
    let chosen;
    if (chessMode === 'normal') {
        chosen = moves[Math.floor(Math.random() * moves.length)];
    } else {
        let best = -Infinity;
        for (const m of moves) {
            const v = minimaxChess(applyChess(chessBoard, m), 2, -Infinity, Infinity, false) + Math.random() * 2;
            if (v > best) { best = v; chosen = m; }
        }
    }
    chessBoard = applyChess(chessBoard, chosen);
    chessTurn = 'w';
    chessAfterMove();
}

function chessAfterMove() {
    const moves = allChessMoves(chessBoard, chessTurn);
    if (!moves.length) { finishChess(); return; }
    const k = findKing(chessBoard, chessTurn), check = k && attacked(chessBoard, k[0], k[1], chessTurn === 'w' ? 'b' : 'w');
    const statusEl = document.getElementById('chess-status');
    if (statusEl) statusEl.textContent = (chessTurn === 'w' ? 'Your turn — White' : 'AI thinking…') + (check ? ' · Check!' : '');
    drawChess();
    if (chessTurn === 'b') setTimeout(chessAI, 280);
}

function finishChess() {
    if (chessOver) return;
    chessOver = true;
    if (typeof DailyChallengeManager !== 'undefined') DailyChallengeManager.trackProgress('chess', 1);
    const king = findKing(chessBoard, chessTurn);
    const checked = king && attacked(chessBoard, king[0], king[1], chessTurn === 'w' ? 'b' : 'w');
    const statusEl = document.getElementById('chess-status');
    if (statusEl) statusEl.textContent = checked ? (chessTurn === 'w' ? 'Checkmate — AI wins' : 'Checkmate — You win!') : 'Draw — no legal moves';
    drawChess();
}

function drawChess() {
    const el = document.getElementById('chess-board');
    if (!el) return;
    el.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const q = document.createElement('button');
            q.className = 'board-square ' + ((r + c) % 2 ? 'dark' : 'light');
            q.textContent = BOARD_SYMBOLS[chessBoard[r][c]] || '';
            if (chessSelected?.[0] === r && chessSelected?.[1] === c) q.classList.add('selected');
            if (chessLegal.some(([y, x]) => y === r && x === c)) q.classList.add('legal');
            q.setAttribute('aria-label', `row ${r + 1} column ${c + 1}`);
            q.onclick = () => clickChess(r, c);
            el.appendChild(q);
        }
    }
}

function clickChess(r, c) {
    if (chessOver || chessTurn !== 'w') return;
    const p = chessBoard[r][c];
    if (chessSelected && chessLegal.some(([y, x]) => y === r && x === c)) {
        chessBoard = applyChess(chessBoard, { from: chessSelected, to: [r, c] });
        chessSelected = null;
        chessLegal = [];
        chessTurn = 'b';
        chessAfterMove();
        return;
    }
    if (p?.[0] === 'w') {
        chessSelected = [r, c];
        chessLegal = chessMoves(chessBoard, r, c);
    } else {
        chessSelected = null;
        chessLegal = [];
    }
    drawChess();
}


/* ==========================================================================
   DAMA / CHECKERS ENGINE & CHAIN JUMP LOGIC
   ========================================================================== */

function damaInitial() {
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) b[r][c] = 'b';
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) b[r][c] = 'w';
    return b;
}

function newDamaGame() {
    damaBoard = damaInitial();
    damaTurn = 'w';
    damaSelected = null;
    damaMoves = [];
    damaChain = null;
    damaOver = false;
    const statusEl = document.getElementById('dama-status');
    if (statusEl) statusEl.textContent = 'Your turn — Red';
    drawDama();
}

function damaCaptures(b, r, c) {
    const p = b[r][c];
    if (!p) return [];
    const dirs = p.toLowerCase() === 'k' ? [-1, 1] : [p === 'w' ? -1 : 1], out = [];
    for (const dr of dirs) {
        for (const dc of [-1, 1]) {
            const mr = r + dr, mc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
            if (inside(lr, lc) && b[mr]?.[mc] && b[mr][mc].toLowerCase() !== p.toLowerCase() && !b[lr][lc]) {
                out.push({ from: [r, c], to: [lr, lc], cap: [mr, mc] });
            }
        }
    }
    return out;
}

function damaSimple(b, r, c) {
    const p = b[r][c], out = [];
    if (!p) return out;
    const dirs = p === 'k' ? [-1, 1] : [p === 'w' ? -1 : 1];
    for (const dr of dirs) {
        for (const dc of [-1, 1]) {
            if (inside(r + dr, c + dc) && !b[r + dr][c + dc]) {
                out.push({ from: [r, c], to: [r + dr, c + dc] });
            }
        }
    }
    return out;
}

function damaAll(b, color) {
    let caps = [], steps = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (b[r][c] && b[r][c].toLowerCase() === color) {
                caps.push(...damaCaptures(b, r, c));
                steps.push(...damaSimple(b, r, c));
            }
        }
    }
    // Enforce mandatory captures rule
    return caps.length ? caps : steps;
}

function applyDama(b, m) {
    const n = cloneBoard(b), p = n[m.from[0]][m.from[1]];
    n[m.from[0]][m.from[1]] = null;
    if (m.cap) n[m.cap[0]][m.cap[1]] = null;
    n[m.to[0]][m.to[1]] = p;
    if ((p === 'w' && m.to[0] === 0) || (p === 'b' && m.to[0] === 7)) n[m.to[0]][m.to[1]] = 'k';
    return n;
}

function damaHasFurther(b, r, c) { return damaCaptures(b, r, c); }

function damaScore(b) {
    let s = 0;
    for (let row of b) for (let p of row) if (p) s += (p.toLowerCase() === 'w' ? -1 : 1) * (p === 'k' ? 3 : 1);
    return s;
}

function damaAI() {
    if (damaOver || damaTurn !== 'b') return;
    const moves = damaAll(damaBoard, 'b');
    if (!moves.length) { endDama('You win!'); return; }
    
    let chosen;
    if (damaMode === 'normal') {
        chosen = moves[Math.floor(Math.random() * moves.length)];
    } else {
        let best = -Infinity;
        for (const m of moves) {
            const v = damaScore(applyDama(damaBoard, m)) + (Math.random() * 0.05);
            if (v > best) { best = v; chosen = m; }
        }
    }
    
    damaBoard = applyDama(damaBoard, chosen);
    
    // AI Chain Jump Execution Logic
    let chainPos = chosen.to;
    while (chosen.cap) {
        const more = damaHasFurther(damaBoard, chainPos[0], chainPos[1]);
        if (!more.length) break;
        const next = more[Math.floor(Math.random() * more.length)];
        damaBoard = applyDama(damaBoard, next);
        chainPos = next.to;
        chosen = next;
    }
    
    damaTurn = 'w';
    damaSelected = null;
    damaMoves = [];
    damaAfter();
}

function damaAfter() {
    const moves = damaAll(damaBoard, damaTurn);
    if (!moves.length) {
        endDama(damaTurn === 'w' ? 'AI wins!' : 'You win!');
        return;
    }
    const statusEl = document.getElementById('dama-status');
    if (statusEl) statusEl.textContent = damaTurn === 'w' ? 'Your turn — Red' : 'AI thinking…';
    drawDama();
    if (damaTurn === 'b') setTimeout(damaAI, 300);
}

function endDama(msg) {
    if (damaOver) return;
    damaOver = true;
    if (typeof DailyChallengeManager !== 'undefined') DailyChallengeManager.trackProgress('dama', 1);
    const statusEl = document.getElementById('dama-status');
    if (statusEl) statusEl.textContent = msg;
    drawDama();
}

function clickDama(r, c) {
    if (damaOver || damaTurn !== 'w') return;
    const candidates = damaChain ? damaCaptures(damaBoard, damaChain[0], damaChain[1]) : damaAll(damaBoard, 'w');
    
    if (damaSelected && candidates.some(m => m.from[0] === damaSelected[0] && m.from[1] === damaSelected[1] && m.to[0] === r && m.to[1] === c)) {
        const move = candidates.find(m => m.from[0] === damaSelected[0] && m.from[1] === damaSelected[1] && m.to[0] === r && m.to[1] === c);
        damaBoard = applyDama(damaBoard, move);
        
        // Check for continuation chain jumps
        if (move.cap && damaHasFurther(damaBoard, r, c).length) {
            damaChain = [r, c];
            damaSelected = [r, c];
            damaMoves = damaHasFurther(damaBoard, r, c);
            const statusEl = document.getElementById('dama-status');
            if (statusEl) statusEl.textContent = 'Chain jump! Capture again.';
            drawDama();
            return;
        }
        
        damaChain = null;
        damaSelected = null;
        damaMoves = [];
        damaTurn = 'b';
        damaAfter();
        return;
    }
    
    if (!damaChain && damaBoard[r][c] === 'w') {
        damaSelected = [r, c];
        damaMoves = candidates.filter(m => m.from[0] === r && m.from[1] === c);
    }
    drawDama();
}

function drawDama() {
    const el = document.getElementById('dama-board');
    if (!el) return;
    el.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const q = document.createElement('button');
            q.className = 'board-square ' + ((r + c) % 2 ? 'dark' : 'light');
            const p = damaBoard[r][c];
            q.textContent = p ? (p === 'w' ? '🔴' : p === 'b' ? '⚫' : '👑') : '';
            if (damaSelected?.[0] === r && damaSelected?.[1] === c) q.classList.add('selected');
            if (damaMoves.some(m => m.to[0] === r && m.to[1] === c)) q.classList.add('legal');
            q.onclick = () => clickDama(r, c);
            el.appendChild(q);
        }
    }
}