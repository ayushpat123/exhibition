import React from 'react';
import './Card.css';

function CardImage(props) {
    var x = 300;
    var y = 300;
    var gap = 50;
    var base = 300;

    if (props.gap) {
        gap = props.gap;
    }

    if (props.x) {
        x = props.x;
        x = x + ((x/base) - 1)*gap;
    }

    var spanx = (x + gap)/(base + gap);

    if (props.y) {
        y = props.y;
        y = y + ((y/base) - 1)*gap;
    }

    var spany = y/10 + gap/10;

    var b = y.toString() + 'px';
    var c = x.toString() + 'px';
    var d = 'span ' + spany.toString();
    var f = 'span ' + spanx.toString();

    var pad = props.pad + "px";
    var light = {backgroundColor:'#111214', height: b, width: c, gridRowEnd: d, gridColumnEnd: f};
    if (props.light){
        light = {backgroundColor:'#F8F6F7', height: b, width: c, gridRowEnd: d, gridColumnEnd: f};
    }
    var tempcss = {height: b, width: '100%', objectFit: 'cover', padding: pad};
    return (
        <div className="card" style={light}>
            <div className="card__body">
                <img src={props.img} style={tempcss} alt=""/>
            </div>
        </div>
    )
}

export default CardImage
