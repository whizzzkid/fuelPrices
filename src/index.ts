import { FuelPrice } from "./FuelPrice";
import { Twitter } from "./Twitter";

function runner() {
    const twitter = new Twitter();
    const fuelPrice = new FuelPrice(twitter);
    fuelPrice.run();
}

runner();