import React from "react";

interface MockTogglerProps {
    mockSettings: any;
    setMockSettings: (s: any) => void;
}

export default (props: MockTogglerProps) => {
    const {mockSettings, setMockSettings} = props;

    function allMocksHide(settings: any, ...exceptions: string[]) {
        const newMockSettings = {...settings};
        Object.keys(newMockSettings).forEach((key: string) => {
            if (exceptions.includes(key)) {
                newMockSettings[key].useMock = true;
                newMockSettings[key].visible = false;
            }

        })
        return newMockSettings;
    }

    const showLobby = () => setMockSettings({
        ...(allMocksHide(mockSettings, "mockSocket", "mockGame")),
        mockLobby: {useMock: true, visible: true}
    })
    const showStart = () => setMockSettings({
        ...(allMocksHide(mockSettings, "mockLobby", "mockGame")),
        mockSocket: {useMock: true, visible: true}
    })
    const showGame = () => setMockSettings({
        ...(allMocksHide(mockSettings, "mockSocket", "mockLobby")),
        mockGame: {useMock: true, visible: true}
    })
    const playerInfoToggle = () => setMockSettings({
        ...mockSettings,
        mockPlayerInfo: {useMock: true, visible: !mockSettings.mockPlayerInfo.visible}
    })
    const playerAreaToggle = () => setMockSettings({
        ...mockSettings,
        mockPlayerArea: {useMock: true, visible: !mockSettings.mockPlayerArea.visible}
    })
    const hinterToggle = () => setMockSettings({
        ...mockSettings,
        mockHinter: {useMock: true, visible: !mockSettings.mockHinter.visible}
    })
    const guesserToggle = () => setMockSettings({
        ...mockSettings,
        mockGueser: {useMock: true, visible: !mockSettings.mockGueser.visible}
    })
    const turnResultsToggle = () => setMockSettings({
        ...mockSettings,
        mockTurnResults: {useMock: true, visible: !mockSettings.mockTurnResults.visible}
    })
    const roundResultsToggle = () => setMockSettings({
        ...mockSettings,
        mockRoundResults: {useMock: true, visible: !mockSettings.mockRoundResults.visible}
    })
    const roleAnnouncementToggle = () => setMockSettings({
        ...mockSettings,
        mockRolesAnnouncement: {useMock: true, visible: !mockSettings.mockRolesAnnouncement.visible}
    })
    const roundAnnouncementToggle = () => setMockSettings({
        ...mockSettings,
        mockRoundAnnouncement: {useMock: true, visible: !mockSettings.mockRoundAnnouncement.visible}
    })
    const turnAnnouncementToggle = () => setMockSettings({
        ...mockSettings,
        mockTurnAnnouncement: {useMock: true, visible: !mockSettings.mockTurnAnnouncement.visible}
    })
    const gameOverAnnouncementToggle = () => setMockSettings({
        ...mockSettings,
        mockGameOverAnnouncement: {useMock: true, visible: !mockSettings.mockGameOverAnnouncement.visible}
    })
    const deduplicationAnnouncementToggle = () => setMockSettings({
        ...mockSettings,
        mockDeduplicationAnnouncement: {useMock: true, visible: !mockSettings.mockDeduplicationAnnouncement.visible}
    })
    const guessStartAnnouncementToggle = () => setMockSettings({
        ...mockSettings,
        mockGuessStartAnnouncement: {useMock: true, visible: !mockSettings.mockGuessStartAnnouncement.visible}
    })
    const gameStatusToggle = () => setMockSettings({
        ...mockSettings,
        mockGameStatus: {useMock: true, visible: !mockSettings.mockGameStatus.visible}
    })
    const timerToggle = () => setMockSettings({
        ...mockSettings,
        mockTimer: {useMock: true, visible: !mockSettings.mockTimer.visible}
    })
    const hintsToggle = () => setMockSettings({
        ...mockSettings,
        mockHints: {useMock: true, visible: !mockSettings.mockHints.visible}
    })
    const getStyle = (key: string) => mockSettings[key].visible ? "green" : "red"

    return (
        <div>
            <div>
                <button onClick={showStart}>Start</button>
                <button onClick={showLobby}>Lobby</button>
                <button onClick={showGame}>Game</button>

                {mockSettings.mockGame.visible &&
                <div>
                    <button style={{color: getStyle("mockPlayerInfo")}} onClick={playerInfoToggle}>PlayerInfo</button>
                    <button style={{color: getStyle("mockPlayerArea")}} onClick={playerAreaToggle}>PlayerArea</button>
                    <button style={{color: getStyle("mockHinter")}} onClick={hinterToggle}>Hinter</button>
                    <button style={{color: getStyle("mockHints")}} onClick={hintsToggle}>HintsOrDedupe</button>
                    <button style={{color: getStyle("mockGueser")}} onClick={guesserToggle}>Guesser</button>
                    <button style={{color: getStyle("mockTurnResults")}} onClick={turnResultsToggle}>TurnResult</button>
                    <button style={{color: getStyle("mockRoundResults")}} onClick={roundResultsToggle}>RoundResult
                    </button>
                    <button style={{color: getStyle("mockRolesAnnouncement")}}
                            onClick={roleAnnouncementToggle}>roleAnnouncement
                    </button>
                    <button style={{color: getStyle("mockRoundAnnouncement")}}
                            onClick={roundAnnouncementToggle}>roundAnnouncement
                    </button>
                    <button style={{color: getStyle("mockTurnAnnouncement")}}
                            onClick={turnAnnouncementToggle}>turnAnnouncement
                    </button>
                    <button style={{color: getStyle("mockDeduplicationAnnouncement")}}
                            onClick={deduplicationAnnouncementToggle}>deduplicationAnnouncement
                    </button>
                    <button style={{color: getStyle("mockGuessStartAnnouncement")}}
                            onClick={guessStartAnnouncementToggle}>guessStartAnnouncement
                    </button>
                    <button style={{color: getStyle("mockGameOverAnnouncement")}}
                            onClick={gameOverAnnouncementToggle}>gameOverAnnouncement
                    </button>
                    <button style={{color: getStyle("mockGameStatus")}} onClick={gameStatusToggle}>gameStatus</button>
                    <button style={{color: getStyle("mockTimer")}} onClick={timerToggle}>timer</button>
                </div>
                }
            </div>

        </div>
    )

}