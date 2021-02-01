import React from 'react';
import './App.css';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import {Home2} from "./components/Home/Home2";


function App() {

    return (
        <div className="App">
            <Router>
                <Switch>
                    <Route path={"/"} component={Home2}/>
                </Switch>
            </Router>
        </div>
    );
}

export default App;




