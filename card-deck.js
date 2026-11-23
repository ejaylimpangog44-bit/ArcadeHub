window.CARD_SUITS = [
  { sym: '♠', color: 'text-slate-900', red: false },
  { sym: '♥', color: 'text-rose-600', red: true },
  { sym: '♦', color: 'text-rose-600', red: true },
  { sym: '♣', color: 'text-slate-900', red: false }
];

window.CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

window.createShuffledDeck = function createShuffledDeck() {
  const deck = [];
  for (let s = 0; s < 4; s++) {
    for (let r = 0; r < 13; r++) {
      deck.push({ suit: window.CARD_SUITS[s], rank: window.CARD_RANKS[r], val: r + 1 });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};