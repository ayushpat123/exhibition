import React, { Suspense } from 'react';
import './Card.css';

function Card(props) {

    var artNum = props.number;
    var a = artNum.toString();
    var Art = React.lazy(() => import("../sketches/Art"+a));
    var x = 300;
    var y = 300;
    var base = 300;
    var gap = 50;

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

    var dark = {backgroundColor:'#111214', height: b, width: c, gridRowEnd: d, gridColumnEnd: f};

    return (
        <div className="card" style={dark}>
            <div className="card__body">
                <Suspense fallback={<div></div>}>
                    <Art x={x} y={y}/>
                </Suspense>
                {/* <h6 className="card__title">{props.name}</h6> */}
            </div>
        </div>
    )
}

export default Card
