import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
    {
        id: 2,
        label: 'MENUITEMS.DASHBOARDS.TEXT',
        icon: 'bx-home-circle',
        subItems: [
            {
                id: 2,
                label: 'Dashboard',
                link: '/dashboard',
                parentId: 2,
                icon: 'bx-home-circle',
            },
            {
                id: 3,
                label: 'Customer Creation',
                link: '/CustomerCreation',
                parentId: 1,
                icon: 'bx-user-check', // Represents invoice approval/decision
            },
            // {
            //     id:4 ,
            //     label: 'Invoice Layout',
            //     link: '/InvoiceLayout',
            //     parentId: 1,
            //     icon: 'bx bx-layout',
            // },
            {
                id:5,
                label: 'Invoice',
                link: '/Invoice',
                parentId: 1,
                icon: 'bx bx-plus',
            },
            
            {
                id: 6,
                label: 'Invoice Decision',
                link: '/InvoiceDecision',
                parentId: 1,
                icon: 'bx-sync', // Represents invoice approval/decision
            },
            {
                id:7 ,
                label: 'Invoice Reports',
                link: '/InvoiceReports',
                parentId: 1,
                icon: 'bx bx-spreadsheet',
            },
            {
                id: 8,
                label: 'User Creation',
                link: '/InvoiceUserCreation',
                parentId: 1,
                icon: 'bx bx-user-check',
            },
            {
                id: 9,
                label: 'Service Charges',
                link: '/ServiceCharges',
                parentId: 1,
                icon: 'bx bx-user-check',
            },
            
           
        ]
    },
    // {
    //     id: 112,
    //     label: 'HEADER.EXTRA_PAGES.TITLE',
    //     icon: 'bx-file',
    //     subItems: [
    //         {
    //             id: 116,
    //             label: 'MENUITEMS.AUTHENTICATION.TEXT',
    //             parentId: 112,
    //             subItems: [
    //                 {
    //                     id: 117,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN',
    //                     link: '/auth/login',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 118,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN2',
    //                     link: '/auth/login-2',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 119,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER',
    //                     link: '/auth/signup',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 120,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER2',
    //                     link: '/auth/signup-2',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 121,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPWD',
    //                     link: '/auth/reset-password',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 122,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPWD2',
    //                     link: '/auth/recoverpwd-2',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 123,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN',
    //                     link: '/pages/lock-screen-1',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 124,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN2',
    //                     link: '/pages/lock-screen-2',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 125,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL',
    //                     link: '/pages/confirm-mail',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 126,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL2',
    //                     link: '/pages/confirm-mail-2',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 127,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION',
    //                     link: '/pages/email-verification',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 128,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION2',
    //                     link: '/pages/email-verification-2',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 129,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION',
    //                     link: '/pages/two-step-verification',
    //                     parentId: 116
    //                 },
    //                 {
    //                     id: 130,
    //                     label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION2',
    //                     link: '/pages/two-step-verification-2',
    //                     parentId: 116
    //                 }
    //             ]
    //         },
    //         {
    //             id: 131,
    //             label: 'MENUITEMS.UTILITY.TEXT',
    //             icon: 'bx-file',
    //             parentId: 112,
    //             subItems: [
    //                 {
    //                     id: 132,
    //                     label: 'MENUITEMS.UTILITY.LIST.STARTER',
    //                     link: '/pages/starter',
    //                     parentId: 131
    //                 },
    //                 {
    //                     id: 133,
    //                     label: 'MENUITEMS.UTILITY.LIST.MAINTENANCE',
    //                     link: '/pages/maintenance',
    //                     parentId: 131
    //                 },
    //                 {
    //                     id: 134,
    //                     label: 'Coming Soon',
    //                     link: '/pages/coming-soon',
    //                     parentId: 131
    //                 },
    //                 {
    //                     id: 135,
    //                     label: 'MENUITEMS.UTILITY.LIST.TIMELINE',
    //                     link: '/pages/timeline',
    //                     parentId: 131
    //                 },
    //                 {
    //                     id: 136,
    //                     label: 'MENUITEMS.UTILITY.LIST.FAQS',
    //                     link: '/pages/faqs',
    //                     parentId: 131
    //                 },
    //                 {
    //                     id: 137,
    //                     label: 'MENUITEMS.UTILITY.LIST.PRICING',
    //                     link: '/pages/pricing',
    //                     parentId: 131
    //                 },
    //                 {
    //                     id: 138,
    //                     label: 'MENUITEMS.UTILITY.LIST.ERROR404',
    //                     link: '/pages/404',
    //                     parentId: 131
    //                 },
    //                 {
    //                     id: 139,
    //                     label: 'MENUITEMS.UTILITY.LIST.ERROR500',
    //                     link: '/pages/500',
    //                     parentId: 131
    //                 },
    //             ]
    //         }
    //     ]
    // }
];

