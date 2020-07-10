declare type DestFuelPrice = {
    dieselChange: number,
    isActive: boolean,
    cityState: string,
    priceDate: string,
    petrolPrice: number,
    petrolChange: number,
    ID: number,
    origin: string,
    type: string,
    dieselPrice: number,
    seoname: string,
    createdDate: string
};

declare type ApiResponse = {
    results: Array<DestFuelPrice>
}