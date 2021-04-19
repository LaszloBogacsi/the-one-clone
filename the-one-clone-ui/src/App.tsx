import React, {useState} from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import {Home2} from "./components/Home/Home2";
import Button from "./components/shared/Button/Button";
import {MockHome} from "./components/Home/MockHome";


function App() {
    const [useMock, setUseMock] = useState(false);
    return (
        <div className="App">
            <Button onClick={() => setUseMock(!useMock)}>TestMode</Button>
            <Router>
                <Switch>
                    <Route path={"/"} component={useMock ? MockHome : Home2}/>
                </Switch>
            </Router>
        </div>
    );
}

export default App;




