import {useState} from "react";

const mockSettingsInitial: { [key: string]: { useMock: boolean, visible: boolean } } = {
    mockSocket: {useMock: true, visible: false},
    mockLobby: {useMock: true, visible: false},
    mockGame: {useMock: true, visible: true},
    mockPlayerInfo: {useMock: true, visible: true},
    mockPlayerArea: {useMock: true, visible: true},
    mockHinter: {useMock: true, visible: true},
    mockGueser: {useMock: true, visible: false},
    mockTurnResults: {useMock: true, visible: false},
    mockRoundResults: {useMock: true, visible: false},
    mockRolesAnnouncement: {useMock: true, visible: false},
    mockRoundAnnouncement: {useMock: true, visible: false},
    mockTurnAnnouncement: {useMock: true, visible: false},
    mockGameOverAnnouncement: {useMock: true, visible: false},
    mockGameStatus: {useMock: true, visible: true},
    mockTimer: {useMock: true, visible: true},
    mockHints: {useMock: true, visible: true},
}

export default () => {
    const [mockSettings, setMockSettings] = useState(mockSettingsInitial);
    return {mockSettings, setMockSettings}
}