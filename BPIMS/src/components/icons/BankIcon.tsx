import React from 'react';
import Svg, { Path } from 'react-native-svg';

const BankIcon = ({ size = 24 }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24">
        <Path
            fill="#000000"
            d="M15 14v-3h3V9l4 3.5l-4 3.5v-2zm-1-6.3V9H2V7.7L8 4zM7 10h2v5H7zm-4 0h2v5H3zm10 0v2.5l-2 1.8V10zm-3.9 6l-.6.5l1.7 1.5H2v-2zm7.9-1v3h-3v2l-4-3.5l4-3.5v2z"
        />
    </Svg>
);

export default BankIcon;
