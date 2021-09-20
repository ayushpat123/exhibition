import React, { Suspense } from 'react';
import './Card.css';

function Card(props) {

    var artNum = props.number;
    var a = artNum.toString();
    var Art = React.lazy(() => import("../sketches/Art"+a));
    var dark = {backgroundColor:'#111214'};
    
    return (
        <div className="card" style={dark}>
            <div className="card__body">
                <Suspense fallback={<div>Art</div>}>
                    <Art />
                </Suspense>
                {/* <h6 className="card__title">{props.name}</h6> */}
            </div>
        </div>
    )
}

export default Card
