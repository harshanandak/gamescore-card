# Tennis Scoring Testing Guide - Phase C

## Overview

Phase C implements authentic tennis scoring with real tennis rules including:
- Point scoring: 0 (Love) → 15 → 30 → 40 → Game
- Deuce/Advantage logic at 40-40
- Set scoring: First to 6 games with 2-game margin
- Tiebreak at 6-6: First to 7 points with 2-point margin
- Match: Best of 3 or Best of 5 sets

---

## Tennis Scoring Rules Reference

### Point Scoring Within a Game
- **0 points**: "Love" (displayed as "0")
- **1 point**: "15"
- **2 points**: "30"
- **3 points**: "40"
- **4 points**: "Game" (if ahead by 2+ points)

### Deuce Rules (40-40)
- When both players reach 40, it's called "Deuce"
- Next point winner gets "Advantage" (AD)
- If player with advantage wins next point → Game won
- If player without advantage wins → Back to Deuce
- Must win by 2 consecutive points from deuce

### Game Scoring
- First to 4 points wins **IF** they're ahead by 2+ points
- Otherwise, continue to deuce/advantage

### Set Scoring
- First to 6 games wins **IF** they're ahead by 2+ games
- If 5-5: Must win 7-5
- If 6-6: Play tiebreak

### Tiebreak Rules
- Played when set reaches 6-6
- First to 7 points wins **IF** ahead by 2+ points
- If 6-6 in tiebreak: Must win 8-6, 9-7, 10-8, etc.
- Winner of tiebreak wins set 7-6

### Match Scoring
- **Best of 3 sets**: First to win 2 sets
- **Best of 5 sets**: First to win 3 sets

---

## Test Scenarios

### Scenario 1: Simple Game (No Deuce)

**Objective:** Test basic point scoring and game completion.

**Test Steps:**
1. Navigate to http://localhost:5173/tennis/tournament
2. Create tournament with 2 teams (Best of 3 sets)
3. Click "Enter Score" on Match 1
4. **Score Game 1:**
   - Tap Team 1: 4 times → Score shows 0, 15, 30, 40, then Game completes
   - Verify: Team 1 games = 1, Team 2 games = 0
   - Verify: Game won notification appears
   - Verify: Haptic feedback (double pulse)

**Expected:**
- ✅ Points display as: 0 → 15 → 30 → 40
- ✅ At 4th point, game completes
- ✅ Games counter increments to 1-0
- ✅ Points reset to 0-0 for next game
- ✅ "Team 1 wins Game 1 (Set 1)!" notification

---

### Scenario 2: Game with Deuce

**Objective:** Test deuce/advantage logic.

**Test Steps:**
1. Score Game 1 to 40-40 (3 points each):
   - Team 1: Q, Q, Q (0→15→30→40)
   - Team 2: P, P, P (0→15→30→40)
   - Verify: Display shows "40 - 40"
2. **Team 1 wins point:**
   - Tap Team 1 once
   - Verify: Display shows "AD - 40"
3. **Team 2 wins point (back to deuce):**
   - Tap Team 2 once
   - Verify: Display shows "40 - 40"
4. **Team 2 wins point (advantage Team 2):**
   - Tap Team 2 once
   - Verify: Display shows "40 - AD"
5. **Team 2 wins point (game):**
   - Tap Team 2 once
   - Verify: Game completes, Team 2 games = 1

**Expected:**
- ✅ At 40-40, displays "40 - 40"
- ✅ Advantage displays as "AD - 40" or "40 - AD"
- ✅ Can go back and forth between deuce and advantage
- ✅ Game only completes after 2-point margin from deuce

---

### Scenario 3: Long Deuce (Multiple Advantages)

**Objective:** Test extended deuce with multiple advantages.

**Test Steps:**
1. Score to 40-40 (deuce)
2. Alternate winning points 10 times:
   - Team 1 → AD, Team 2 → Deuce, Team 2 → AD, Team 1 → Deuce...
3. Finally, Team 1 wins 2 consecutive points

**Expected:**
- ✅ Deuce can continue indefinitely
- ✅ Displays alternate correctly between "40-40", "AD-40", "40-AD"
- ✅ Game only completes when one player wins 2 consecutive points

---

### Scenario 4: Simple Set (6-0)

**Objective:** Test set completion without tiebreak.

**Test Steps:**
1. Win 6 games for Team 1 (dominate each game 40-0):
   - Game 1: Team 1 wins 4-0
   - Game 2: Team 1 wins 4-0
   - ...
   - Game 6: Team 1 wins 4-0
2. Verify: After Game 6, Set 1 completes
3. Verify: Auto-advances to Set 2
4. Verify: Set won notification appears

**Expected:**
- ✅ Set completes at 6-0
- ✅ "Team 1 wins Set 1!" notification
- ✅ Auto-advances to Set 2
- ✅ Match score shows "6-0" for Set 1

---

### Scenario 5: Set with 2-Game Margin (7-5)

**Objective:** Test set completion with 2-game margin rule.

**Test Steps:**
1. Score set to 5-5:
   - Alternate wins: T1, T2, T1, T2, T1, T2, T1, T2, T1, T2
   - Result: 5 games each
2. Team 1 wins Game 11 → 6-5
3. Verify: Set does NOT complete (not 2-game margin)
4. Team 1 wins Game 12 → 7-5
5. Verify: Set completes at 7-5

**Expected:**
- ✅ At 6-5, set continues (no completion)
- ✅ At 7-5, set completes
- ✅ Set won notification appears
- ✅ Auto-advances to next set

---

### Scenario 6: Tiebreak at 6-6

**Objective:** Test tiebreak logic.

**Test Steps:**
1. Score set to 6-6:
   - Alternate wins until 6 games each
2. Verify: Badge changes from "Set 1 of 3" to "Tiebreak"
3. Verify: Points display switches from 0/15/30/40 to numeric (0, 1, 2...)
4. **Score tiebreak:**
   - Team 1: 7 points
   - Team 2: 5 points
5. Verify: Tiebreak completes at 7-5
6. Verify: Set score shows "6-6 (7-5)" or "7-6"
7. Verify: Set won notification appears

**Expected:**
- ✅ At 6-6, tiebreak automatically starts
- ✅ Badge shows "Tiebreak"
- ✅ Tiebreak uses numeric scoring (0, 1, 2, 3...)
- ✅ First to 7 with 2-point margin wins
- ✅ Set displays as 7-6 (with tiebreak score)

---

### Scenario 7: Long Tiebreak (10-8)

**Objective:** Test tiebreak with 2-point margin rule.

**Test Steps:**
1. Score set to 6-6 (tiebreak starts)
2. Score tiebreak to 6-6:
   - Alternate wins until tied 6-6
3. Verify: Tiebreak does NOT complete at 6-6
4. Score to 7-7, 8-8, 9-9
5. Finally: Team 1 scores 10-8

**Expected:**
- ✅ Tiebreak continues past 7 points if not 2-point margin
- ✅ Tiebreak completes at 10-8
- ✅ Set score shows 7-6 (10-8)

---

### Scenario 8: Full Match (Best of 3)

**Objective:** Test complete match with 3 sets.

**Test Steps:**
1. **Set 1:** Team 1 wins 6-4
   - Team 1: 6 games, Team 2: 4 games
2. **Set 2:** Team 2 wins 7-5
   - Team 1: 5 games, Team 2: 7 games
3. **Set 3:** Team 1 wins 6-3
   - Team 1: 6 games, Team 2: 3 games
4. Verify: Match completes after Set 3
5. Verify: Match score shows: 6-4, 7-5, 6-3
6. Verify: Winner = Team 1 (won 2 sets)

**Expected:**
- ✅ Match completes when one player wins 2 sets
- ✅ Confetti animation appears
- ✅ Victory haptic pattern (5 pulses)
- ✅ "Match Complete" badge appears
- ✅ Cannot add more points after match completes

---

### Scenario 9: Undo During Game

**Objective:** Test undo functionality within a game.

**Test Steps:**
1. Score Game 1 to 40-15:
   - Team 1: 3 points (40)
   - Team 2: 1 point (15)
2. Click Undo 2 times
3. Verify: Score returns to 30-0
4. Continue scoring to complete game

**Expected:**
- ✅ Undo reverts last action
- ✅ Points decrease correctly
- ✅ Can undo multiple times
- ✅ Undo disabled when history is empty

---

### Scenario 10: Undo Across Game Boundary

**Objective:** Test undo that crosses game completion.

**Test Steps:**
1. Score Game 1: Team 1 wins 40-0 (4-0 points)
2. Verify: Games = 1-0, Points = 0-0
3. Score 2 points in Game 2: 30-0
4. Click Undo 3 times
5. Verify: Returns to Game 1 at 40-0 (before game completed)
6. Verify: Games = 0-0, Points = 40-0

**Expected:**
- ✅ Undo can revert game completion
- ✅ Games counter decrements
- ✅ Points restore to pre-game-win state
- ✅ Can continue playing from restored state

---

### Scenario 11: Undo in Tiebreak

**Objective:** Test undo functionality during tiebreak.

**Test Steps:**
1. Score set to 6-6 (tiebreak starts)
2. Score tiebreak to 5-3
3. Click Undo 3 times
4. Verify: Tiebreak score returns to 2-3
5. Continue to complete tiebreak

**Expected:**
- ✅ Undo works in tiebreak mode
- ✅ Tiebreak points decrement correctly
- ✅ Can undo multiple times in tiebreak

---

### Scenario 12: Draft Saving Mid-Match

**Objective:** Test draft saving and resume functionality.

**Test Steps:**
1. Start match, score Set 1: 6-4 (Team 1 wins)
2. Start Set 2, score to 3-2, current game at 30-15
3. Click "Save Draft"
4. Verify: Returns to tournament view
5. Verify: Match shows "In Progress" badge with "▶ Resume Match" button
6. Click "Resume Match"
7. Verify: Loads at Set 2, games 3-2, points 30-15
8. Verify: Can undo actions from before draft save
9. Complete match and save

**Expected:**
- ✅ Draft saves exact state (set, games, points, tiebreak mode)
- ✅ Resume restores complete state
- ✅ History is preserved (undo works)
- ✅ Can save draft mid-game, mid-set, mid-tiebreak

---

### Scenario 13: Keyboard Shortcuts (Desktop)

**Objective:** Test keyboard navigation and shortcuts.

**Test Steps:**
1. On desktop (non-touch device), verify keyboard hint appears
2. Press Q key → Team 1 point increases
3. Press P key → Team 2 point increases
4. Score to 40-0, press Q → Game completes
5. Press U key → Undo last action

**Expected:**
- ✅ Keyboard hint visible on desktop
- ✅ Q adds point to Team 1
- ✅ P adds point to Team 2
- ✅ U undoes last action
- ✅ Keyboard shortcuts disabled on mobile/touch devices

---

### Scenario 14: Accessibility (Screen Reader)

**Objective:** Test screen reader announcements.

**Test Steps:**
1. Enable screen reader (NVDA/VoiceOver/TalkBack)
2. Navigate to live scoring
3. Verify: Score cards announce "Team Alpha: 15. Press Enter or click to add point"
4. Add point, verify ARIA live region announces: "Team Alpha: 30. Team Beta: 0."
5. Complete game, verify announcement
6. Navigate to tiebreak, verify "Tiebreak" announced

**Expected:**
- ✅ Score cards have ARIA labels
- ✅ ARIA live region announces score updates
- ✅ Keyboard navigation works (Tab, Enter, Space)
- ✅ Set/game completion announced

---

### Scenario 15: Mobile Touch Interactions

**Objective:** Test touch interactions on mobile devices.

**Test Steps:**
1. Open on mobile device (iOS/Android)
2. Verify: Keyboard hint is hidden
3. Verify: Score cards are large tap targets (250px+ height)
4. Tap Team 1 card 10 times rapidly
5. Verify: All 10 taps register (no double-taps)
6. Verify: No double-tap zoom occurs
7. Verify: Haptic feedback on each tap (if supported)

**Expected:**
- ✅ Keyboard hint hidden on mobile
- ✅ Tap targets exceed 44px minimum
- ✅ touchAction: 'manipulation' prevents zoom
- ✅ Haptic feedback works (iOS/Android)
- ✅ Smooth animations at 60fps

---

## Edge Cases to Test

### Edge Case 1: Cancel with Unsaved Changes
- Score several points
- Click Cancel
- Verify: Confirmation dialog appears
- Test: Click "Cancel" → stays in scoring
- Test: Click "OK" → returns to tournament without saving

### Edge Case 2: Rapid Tapping During Animation
- Tap score card rapidly during score-pop animation
- Verify: All taps register (with 150ms debounce)
- Verify: Animation doesn't block input

### Edge Case 3: Browser Back Button
- Start scoring match
- Press browser back button
- Verify: Confirmation dialog appears
- Test: Cancel → stays in scoring
- Test: OK → returns to tournament

### Edge Case 4: Match Already Completed
- Complete full match
- Click "Edit Score" from tournament view
- Verify: Last set marked as completed
- Verify: Cannot add more points by tapping
- Can undo to reopen set and continue

### Edge Case 5: Tiebreak at 20-20
- Score tiebreak to 20-20
- Continue until one player wins by 2 (22-20)
- Verify: Tiebreak continues past 7 points
- Verify: Completes correctly at 22-20

---

## Validation Rules

### Point Scoring Validation
- ✅ Points: 0 → 15 → 30 → 40 → Game (or Deuce)
- ✅ Deuce at 40-40: Must win by 2 consecutive points
- ✅ Advantage displays as "AD"

### Game Scoring Validation
- ✅ First to 4 points wins IF 2-point margin
- ✅ Otherwise, continue to deuce/advantage
- ✅ Game resets points to 0-0 for next game

### Set Scoring Validation
- ✅ First to 6 games wins IF 2-game margin
- ✅ At 6-6, play tiebreak
- ✅ Set can go to 7-5, 7-6 (tiebreak), 8-6, etc.

### Tiebreak Validation
- ✅ First to 7 points wins IF 2-point margin
- ✅ Can continue past 7 (e.g., 10-8, 15-13)
- ✅ Winner of tiebreak wins set 7-6

### Match Scoring Validation
- ✅ Best of 3: First to win 2 sets
- ✅ Best of 5: First to win 3 sets
- ✅ Match completes immediately after final set

---

## UI/UX Checks

### Display Elements
- ✅ Top bar: Back button + "Set X of Y" badge (or "Tiebreak")
- ✅ Center: Large tap-to-score cards (Team 1 | Team 2)
- ✅ Score display: 0/15/30/40/AD in regular games, numeric in tiebreaks
- ✅ Games counter: Shows games won (e.g., "Games: 3")
- ✅ Match score section: Shows completed sets with scores
- ✅ Bottom bar: Undo + Cancel + Save Draft + Save & Return

### Interactions
- ✅ Tap entire card to add point
- ✅ Score animates with score-pop effect
- ✅ Game won notification (1.5s popup)
- ✅ Set won notification (1.5s popup)
- ✅ Match won confetti animation (3.5s)
- ✅ Undo reverts last action
- ✅ Auto-advances to next set after set completion

### Responsive Design
- ✅ Works on mobile (large tap targets)
- ✅ Works on desktop (keyboard shortcuts)
- ✅ Score font scales appropriately
- ✅ Layout adapts to portrait/landscape

---

## Performance Checks

### Load Time
- ✅ Component loads in < 500ms
- ✅ No lag when tapping score cards
- ✅ Animations smooth at 60fps

### Memory Usage
- ✅ History limited to last 100 actions
- ✅ No memory leaks from event listeners
- ✅ Confetti elements cleaned up after 3.5s

---

## Success Criteria - Phase C

All of the following must pass:

### Tennis Scoring Logic
- [ ] Point scoring: 0-15-30-40-Game works correctly
- [ ] Deuce logic: 40-40 requires 2-point margin
- [ ] Advantage: Displays "AD" correctly
- [ ] Game completion: Only when ahead by 2+ points
- [ ] Set completion: First to 6 with 2-game margin
- [ ] Tiebreak trigger: Activates at 6-6 automatically
- [ ] Tiebreak scoring: First to 7 with 2-point margin
- [ ] Match completion: Best of 3 (2 sets) or Best of 5 (3 sets)

### Undo Functionality
- [ ] Undo works within a game
- [ ] Undo works across game boundaries
- [ ] Undo works in tiebreak mode
- [ ] Undo works across set boundaries
- [ ] History limited to 100 actions

### Draft Saving
- [ ] Save Draft button appears after first change
- [ ] Draft saves: set, games, points, tiebreak state, history
- [ ] Resume restores exact state
- [ ] Undo history preserved after resume

### Accessibility
- [ ] ARIA labels on all interactive elements
- [ ] ARIA live region announces scores
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus indicators visible

### Mobile
- [ ] Touch targets exceed 44px minimum
- [ ] No double-tap zoom
- [ ] Haptic feedback works
- [ ] Animations smooth on mobile

### Animations
- [ ] Score-pop animation (300ms)
- [ ] Game won notification (1.5s popup)
- [ ] Set won notification (1.5s popup)
- [ ] Match won confetti (3.5s)
- [ ] Reduced motion preference respected

---

## Known Limitations

### Current Implementation
1. **No service tracking** - Doesn't track who serves (not required for scoring)
2. **No advantage count** - Doesn't display "Deuce, Adv In, Adv Out" labels
3. **No detailed tiebreak rules** - Doesn't show who serves in tiebreak
4. **No match type selection** - Defaults to Best of 3 (set in tournament format)

### Future Enhancements (Optional)
- Add service indicator (visual cue for who serves)
- Add detailed deuce labels ("Deuce", "Advantage In", "Advantage Out")
- Add match statistics (aces, double faults, break points)
- Add tiebreak service rotation indicator

---

## Bug Reporting Template

When reporting tennis-specific bugs, include:

```markdown
### Bug: [Short description]

**Scenario:** Best of 3 sets, Set 1, Game 5
**Score Before:** 40-40 (Deuce)
**Action:** Tapped Team 1 twice
**Expected:** Should show "AD" then "Game won"
**Actual:** Score stuck at 40-40

**Steps to Reproduce:**
1. Score to 40-40
2. Tap Team 1 card twice
3. Observe issue

**Console Errors:** [Copy any errors]
**Browser:** Chrome 120 on Windows 11
```

---

## Next Steps After Phase C

**Current Phase:** Phase C - Tennis Enhancement ← YOU ARE HERE

**After Phase C Completes:**
- Option 1: Sprint 6 - Edge Cases & Documentation
- Option 2: Phase D - Polish & Production Deployment
- Option 3: Additional features (statistics, advanced tennis rules)

**Remaining Work:**
- Sprint 6: Edge Cases & Documentation (6-8 hours)
- Phase D: Production deployment preparation

**Total Remaining:** 6-8 hours

---

## Resources

### Tennis Rules References
- [ITF Rules of Tennis](https://www.itftennis.com/en/about-us/governance/rules-and-regulations/)
- [Tennis Scoring Explained](https://www.usta.com/en/home/improve/tips-and-instruction/national/tennis-scoring-rules.html)
- [Tiebreak Rules](https://www.itftennis.com/en/about-us/governance/rules-and-regulations/tiebreak/)

### Code References
- **Component:** `src/designs/design1-mono/scoring/MonoTennisLiveScore.jsx`
- **Routing:** `src/designs/design1-mono/MonoTournamentLiveScore.jsx`
- **Sport Config:** `src/models/sportRegistry.js` (tennis configuration)

---

## Sprint Summary

**Status:** ✅ **COMPLETE** (Implementation)
🟡 **IN PROGRESS** (Testing)

**Goal:** Implement real tennis scoring to replace simplified "points to 21" system

**Implementation Completed:**
- ✅ Created MonoTennisLiveScore.jsx with full tennis logic
- ✅ Point system: 0-15-30-40-Game with deuce/advantage
- ✅ Set system: First to 6 with 2-game margin
- ✅ Tiebreak: Automatic at 6-6, first to 7 with 2-point margin
- ✅ Match completion: Best of 3 or Best of 5
- ✅ Undo functionality across games/sets/tiebreaks
- ✅ Draft saving with full state preservation
- ✅ Haptic feedback and animations
- ✅ ARIA labels and accessibility
- ✅ Updated routing to use MonoTennisLiveScore

**Time Spent:** ~3 hours (implementation + testing documentation)

**Next:** Manual testing with real scenarios on development server
