export const IROBE_OPTIONS = [
 ["Custom design", ""],
 ["I Robe 1","i-robe-number-1"],["I Robe 1A","i-robe-number-1a"],["I Robe 2","i-robe-number-2"],["I Robe 2A","i-robe-number-2a"],
 ["I Robe 3","i-robe-number-3"],["I Robe 3A","i-robe-number-3a"],["I Robe 3B","i-robe-number-3b"],["I Robe 3B 6Drw","i-robe-number-3b6d"],
 ["I Robe 3C","i-robe-number-3c"],["I Robe 3C 6 Drw","i-robe-number-3c6d"],["I Robe 4","i-robe-number-4"],["I Robe 4A","i-robe-number-4a"],
 ["I Robe 4B","i-robe-number-4b"],["I Robe 4C","i-robe-number-4c"],["I Robe 5","i-robe-number-5"],["I Robe 5 6 Drw","i-robe-number-5-6d"],
 ["I Robe 5A","i-robe-number-5a"],["I Robe 5A 6 Drw","i-robe-number-5a6d"],["I Robe 5B","i-robe-5b"],["I Robe 5B 6 Drw","i-robe-number-5b6d"],
 ["I Robe 5C","i-robe-number-5c"],["I Robe 5C 6 Drw","i-robe-number-5c6d"],["I Robe 6","i-robe-number-6"],["I Robe 6A","i-robe-number-6a"],
 ["I Robe 6B","i-robe-number-6b"],["I Robe 6C","i-robe-number-6c"],["I Robe 6D","i-robe-number-6d"],["I Robe 7","i-robe-number-7"],
 ["I Robe 7A","i-robe-number-7a"],["I Robe 7A 6Drw","i-robe-number-7a6d"],["I Robe 7B","i-robe-wardrobe-7b"],["I Robe 8","i-robe-number-8"],
 ["I Robe 8A 6 Drws","i-robe-wardrobe-8a"],["I Robe 8B","i-robe-number-8b"],["I Robe 8C","i-robe-number-8c"],
 ["I Robe Flexi 450mm 6 Shelf","flexi"],["I Robe Flexi 600mm 6 Shelf","flexi"],["I Robe Flexi 450mm 3 Drawer","flexi"],
 ["I Robe Flexi 600mm 3 Drawer","flexi"],["I Robe Flexi 450mm 6 Drawer","flexi"],["I Robe Flexi 600mm 6 Drawer","flexi"],
] as const;

export function iRobeUrl(name:string){
 const slug=IROBE_OPTIONS.find(([label])=>label===name)?.[1];
 if(!slug)return "";
 return slug==="flexi"?"https://simplywardrobes.co.nz/collections/i-robe-flexi/products/i-robe-flexi-reach-in":`https://simplywardrobes.co.nz/collections/i-robe-1/products/${slug}`;
}
export const HARDWARE_COLOURS=["Undecided","Silver","Black"] as const;
export const BOARD_COLOURS=["Undecided","White Linear","Maple Cream","Grey Ash"] as const;
export const DOOR_CONFIGURATIONS=["2 doors on double track","3 doors on double track","4 doors on double track","3 doors on triple track"] as const;
export const MIRROR_OPTIONS=["No mirror selected","Mirror","Extra tinted mirror"] as const;
export const ACCESSORY_OPTIONS=[
 "Wall Mounted Shoe Rack × 10",
 "Pull Out Shoe Rack",
 "Wall Mounted Fold Down Ironing Board",
 "Wall Mounted Swivel 180° Rotating Ironing Board",
 "Pull Out Ironing Board",
 "Pull Out Mirror (Silver)",
 "Pull Out Mirror (Black)",
] as const;
