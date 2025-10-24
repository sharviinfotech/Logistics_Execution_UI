export interface TypeOfMaterial {
    MTART: string;
    MTBEZ: string;
}

export interface Incoterm {
    INCO1: string;
    BEZEI: string;
}

export interface ShipmentNonSapRequest {
    MANDT: string;
    VBELN: string;
    POSNR: number;
    ZPRODUCT: string;
    MTART: string;
    MAKTX: string;
    ZSETS: number;
    ZAH: number;
    ZSHIP_WT: number;
    ZBATCOND: string;
    ZINCO: string;
    ZINS_SCPOE: string;
    ZKM: number;
}

export interface ShipmentNonSapResponse {
    NUMBER: string;
    MSG: string;
}

export interface ShipmentNonSapReport {
    REPORT: string;
}

export interface ShipmentIncotermRequest {
    INCO1: string;
    BEZEI: string;
}