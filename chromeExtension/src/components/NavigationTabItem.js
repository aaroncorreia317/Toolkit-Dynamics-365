import React, { useContext } from 'react';
import Honeybadger from '@honeybadger-io/js';

import { StoreContext } from './StoreProvider';

export default function NavigationTabItem({ navigator }) {
    const { state, actions } = useContext(StoreContext);

    function handleClick(e) {
        e.preventDefault();

        try {
            navigator.navigate(state, actions);
        }
        catch (e) {
            Honeybadger.notify(e, `Error encountered during navigation to '${navigator.title}'`);
        }
    }

    return (
        <li className="gotdibbs-toolbox-item">
            <a href="#" className="gotdibbs-toolbox-item-link" onClick={handleClick} data-testid={navigator.key}>
                {navigator.title}
            </a>
        </li>
    );
}