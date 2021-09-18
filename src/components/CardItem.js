import React, { Suspense } from 'react';
import './CardItem.css';

function CardItem(props) {

    var artNum = props.number;
    var a = artNum.toString();
    var Art = React.lazy(() => import("../sketches/Art"+a));

    return (
        <div className="card">
            <div className="card__body">
                <Suspense fallback={<div>Art</div>}>
                    <Art />
                </Suspense>
                <h2 className="card__title">{props.name}</h2>
            </div>
        </div>
    )
}

export default CardItem
