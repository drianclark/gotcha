"use strict";
exports.__esModule = true;
exports.GamePhase = void 0;
var GamePhase;
(function (GamePhase) {
    GamePhase[GamePhase["Login"] = 0] = "Login";
    GamePhase[GamePhase["Lobby"] = 1] = "Lobby";
    GamePhase[GamePhase["Wait"] = 2] = "Wait";
    GamePhase[GamePhase["Question"] = 3] = "Question";
    GamePhase[GamePhase["Answer"] = 4] = "Answer";
    GamePhase[GamePhase["Results"] = 5] = "Results";
    GamePhase[GamePhase["End"] = 6] = "End";
})(GamePhase = exports.GamePhase || (exports.GamePhase = {}));
