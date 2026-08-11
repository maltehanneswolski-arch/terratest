/**
 * German translations for copy that is still hardcoded in the game pages.
 *
 * Keys are the exact English text as rendered. The mask in `uiMask.ts` replaces
 * a text node only when its whole trimmed content matches a key here, so an
 * entry can never partially mangle a country name or a value.
 *
 * Adding a string: copy the English exactly as it appears in the JSX.
 * Removing one: once the string is migrated to a real t() key in
 * `local/de/common.ts`, delete it here — the locale file wins.
 *
 * Register is informal "du" throughout, matching the rest of the product.
 */
export const DE_UI_MASK: Record<string, string> = {
  /* ── Shared labels and actions ─────────────────────────────────── */
  'How to play': 'Spielanleitung',
  'How to Play': 'Spielanleitung',
  'Play Again': 'Nochmal spielen',
  'Play again': 'Nochmal spielen',
  'New Game': 'Neues Spiel',
  'New round': 'Neue Runde',
  'New Round': 'Neue Runde',
  'Try again': 'Nochmal versuchen',
  'Retry': 'Nochmal',
  'Submit': 'Absenden',
  'Submit guess': 'Tipp absenden',
  'Give up': 'Aufgeben',
  'Back to Home': 'Zur Startseite',
  'Next': 'Weiter',
  'Continue': 'Weiter',
  'See Results': 'Ergebnisse ansehen',
  'Close': 'Schließen',
  'Score': 'Punktestand',
  'Scoring': 'Punktevergabe',
  'Accuracy': 'Genauigkeit',
  'Accuracy Score': 'Genauigkeit',
  'Progress': 'Fortschritt',
  'Streak': 'Serie',
  'Current streak': 'Aktuelle Serie',
  'Best streak': 'Beste Serie',
  'Game Over!': 'Spiel vorbei!',
  'All done!': 'Fertig!',
  'Correct!': 'Richtig!',
  'Not quite': 'Knapp daneben',
  'Your picks': 'Deine Tipps',
  'Your pick': 'Dein Tipp',
  'Your Cities': 'Deine Städte',
  'Your profile': 'Dein Profil',
  'Your Profile': 'Dein Profil',
  'Actual neighbours': 'Tatsächliche Nachbarn',
  'Actual rank:': 'Tatsächlicher Rang:',
  'Correct ranking': 'Richtige Reihenfolge',
  'Round score': 'Rundenpunkte',
  'out of': 'von',
  'points': 'Punkte',
  'per day': 'pro Tag',
  'Tries left': 'Versuche übrig',
  'Hints unlocked': 'Freigeschaltete Hinweise',
  'Hints': 'Hinweise',
  'Guess history': 'Bisherige Tipps',
  'Come back tomorrow for a new challenge!': 'Komm morgen wieder für eine neue Herausforderung!',
  'Copy results': 'Ergebnis kopieren',
  'Share Results': 'Ergebnis teilen',
  'Share results': 'Ergebnis teilen',
  'Share result': 'Ergebnis teilen',

  /* ── PopStack ──────────────────────────────────────────────────── */
  "Today's target": 'Heutiges Ziel',
  "TODAY'S TARGET": 'HEUTIGES ZIEL',
  'Combined population to match': 'Zu treffende Gesamtbevölkerung',
  'Select 3 cities whose total population matches this number':
    'Wähle 3 Städte, deren Gesamtbevölkerung dieser Zahl entspricht',
  'Bonus': 'Bonus',
  'Restriction': 'Einschränkung',
  'Halves your accuracy gap!': 'Halbiert deinen Abstand zum Ziel!',
  'Only these cities allowed!': 'Nur diese Städte sind erlaubt!',
  'Target': 'Ziel',
  'Your Total': 'Deine Summe',
  'Difference': 'Abweichung',
  'Bonus Applied!': 'Bonus angewendet!',
  'No cities selected yet': 'Noch keine Städte ausgewählt',
  'Search and select 3 cities': 'Suche und wähle 3 Städte',
  'A restriction limits you to cities from a specific region or continent. Only qualifying cities can be selected.':
    'Eine Einschränkung begrenzt dich auf Städte aus einer bestimmten Region oder einem Kontinent. Nur passende Städte lassen sich auswählen.',
  'A bonus country is revealed each round. Including a city from that country halves your accuracy penalty.':
    'Jede Runde wird ein Bonusland verraten. Wählst du eine Stadt daraus, halbiert sich dein Abstand zum Ziel.',

  /* ── Elevation ─────────────────────────────────────────────────── */
  'Which city is higher?': 'Welche Stadt liegt höher?',
  'Which city sits higher?': 'Welche Stadt liegt höher?',
  'Games Played': 'Gespielte Spiele',
  'Games played': 'Gespielte Spiele',
  'After each pick the actual elevations are revealed so you can learn from it.':
    'Nach jeder Wahl werden die echten Höhen angezeigt, damit du daraus lernen kannst.',

  /* ── Capital Clash ─────────────────────────────────────────────── */
  'What is the capital of': 'Was ist die Hauptstadt von',
  'Your final streak': 'Deine Endserie',
  'Correct answers in a row': 'Richtige Antworten in Folge',
  'The correct answer was:': 'Die richtige Antwort war:',
  'A country appears with its flag. Pick the correct capital city from four options — and keep your streak alive!':
    'Ein Land erscheint mit seiner Flagge. Wähle die richtige Hauptstadt aus vier Optionen — und halte deine Serie am Leben!',

  /* ── Border Domino ─────────────────────────────────────────────── */
  'Current country': 'Aktuelles Land',
  'Current chain length': 'Aktuelle Kettenlänge',
  'Chain length': 'Kettenlänge',
  "Today's restriction": 'Heutige Einschränkung',
  'Best chain today': 'Beste Kette heute',
  'Maximum possible chain': 'Längste mögliche Kette',
  'Optimal path': 'Optimale Route',
  'Show chain': 'Kette anzeigen',
  'Hide chain': 'Kette ausblenden',
  'Each country you name must share a land border with the current country.':
    'Jedes Land, das du nennst, muss eine Landgrenze mit dem aktuellen Land teilen.',
  "You can't reuse a country. The chain ends when no valid move remains — or when you give up.":
    'Du kannst kein Land doppelt verwenden. Die Kette endet, wenn kein gültiger Zug mehr möglich ist — oder wenn du aufgibst.',
  'Alphabetically earlier': 'Alphabetisch früher',
  'Alphabetically later': 'Alphabetisch später',
  'North only': 'Nur nach Norden',
  'South only': 'Nur nach Süden',
  'East only': 'Nur nach Osten',
  'West only': 'Nur nach Westen',
  'Longer name': 'Längerer Name',
  'Shorter name': 'Kürzerer Name',
  'More neighbours': 'Mehr Nachbarn',
  'Fewer neighbours': 'Weniger Nachbarn',

  /* ── Borderline ────────────────────────────────────────────────── */
  'Pick the two countries': 'Wähle die beiden Länder',
  'Country 1': 'Land 1',
  'Country 2': 'Land 2',
  'Border trace': 'Grenzverlauf',
  'Current border': 'Aktuelle Grenze',
  'Daily summary': 'Tagesübersicht',
  'Locked in': 'Gesichert',
  'Search and select a country…': 'Land suchen und auswählen …',
  'Use the search fields, then select one country for each slot from the dropdown suggestions.':
    'Nutze die Suchfelder und wähle für jeden Platz ein Land aus den Vorschlägen.',
  'This trace comes from a real shared country boundary. Name the two countries that touch here.':
    'Dieser Verlauf stammt von einer echten Ländergrenze. Nenne die beiden Länder, die sich hier berühren.',
  'No guesses yet. Start with your best read of the border shape.':
    'Noch keine Tipps. Fang mit deiner besten Einschätzung der Grenzform an.',
  'No hints yet. Your first clue appears after the first missed guess.':
    'Noch keine Hinweise. Der erste Hinweis erscheint nach dem ersten Fehlversuch.',
  'Type to search, then choose from the list. Only selected countries count as guesses.':
    'Tippe zum Suchen und wähle aus der Liste. Nur ausgewählte Länder zählen als Tipp.',

  /* ── Blind Ranking ─────────────────────────────────────────────── */
  "Today's ranking": 'Heutige Rangliste',
  "Today's result": 'Heutiges Ergebnis',
  'Perfect!': 'Perfekt!',
  'Excellent': 'Ausgezeichnet',
  'Great': 'Sehr gut',
  'Good': 'Gut',
  'Keep trying': 'Weiter üben',
  'Place the countries from highest to lowest value.':
    'Ordne die Länder vom höchsten zum niedrigsten Wert.',

  /* ── Latitude Ladder ───────────────────────────────────────────── */
  'City pool': 'Städte-Vorrat',
  'Your ladder': 'Deine Leiter',
  'remaining': 'übrig',
  'placed': 'platziert',
  'Tap to place here': 'Zum Platzieren tippen',
  'Tap a city, or drag one here': 'Tippe eine Stadt an oder zieh eine hierher',
  'All placed — tap a card, or drag one back': 'Alle platziert — tippe eine Karte an oder zieh eine zurück',
  'Check order': 'Reihenfolge prüfen',
  'Start ranking!': 'Los sortieren!',

  /* ── Compass Quest ─────────────────────────────────────────────── */
  'You are here': 'Du bist hier',
  'Aim for this': 'Ziel anpeilen',
  'Heading': 'Kurs',
  'Lock in heading': 'Kurs festlegen',
  'Compass Quest complete': 'Compass Quest abgeschlossen',
  'Average error': 'Durchschnittlicher Fehler',
  'A starting capital is shown. Rotate the compass needle to point in the direction of the target capital — then lock in your heading.':
    'Eine Starthauptstadt wird angezeigt. Drehe die Kompassnadel in Richtung der Zielhauptstadt — und lege dann deinen Kurs fest.',

  /* ── Country Detective ─────────────────────────────────────────── */
  'Puzzle solved!': 'Rätsel gelöst!',
  'Puzzle complete': 'Rätsel beendet',
  'Your guesses': 'Deine Tipps',
  'Clues': 'Hinweise',
  'Reveal a clue': 'Hinweis aufdecken',

  /* ── World Order ───────────────────────────────────────────────── */
  'Above 2': 'Zwei darüber',
  'Above 1': 'Eins darüber',
  'Below 1': 'Eins darunter',
  'Below 2': 'Zwei darunter',
  'Perfect': 'Perfekt',
  'Right side': 'Richtige Seite',
  'Wrong direction': 'Falsche Richtung',
  'Select countries for each position': 'Wähle Länder für jede Position',

  /* ── Stat Bluff ────────────────────────────────────────────────── */
  'Spot the bluff!': 'Finde den Bluff!',
  'Nailed it': 'Genau richtig',
  'Bluffed!': 'Reingefallen!',
  'Current country': 'Aktuelles Land',

  /* ── Dream Country ─────────────────────────────────────────────── */
  'Retake Survey': 'Umfrage wiederholen',
  'Country Comparison': 'Ländervergleich',
  'All Countries Ranked': 'Alle Länder im Ranking',
  'Select Factors': 'Faktoren wählen',
  'Not like me': 'Trifft nicht zu',
  'Very much like me': 'Trifft voll zu',
};
