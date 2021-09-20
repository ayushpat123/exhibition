import React from 'react';
import './Card.css';

function CardImage(props) {
    var pad = props.pad + "px";
    var light = {backgroundColor:'#111214'};
    if (props.light){
        light = {backgroundColor:'#F8F6F7'};
    }
    var tempcss = {height: '300px', width: '100%', objectFit: 'cover', padding: pad};
    return (
        <div className="card" style={light}>
            <div className="card__body">
                <img src={props.img} style={tempcss} alt=""/>
            </div>
        </div>
    )
}

export default CardImage
