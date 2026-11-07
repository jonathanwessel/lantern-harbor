/* Visual themes, one per harbor. Color pairs are [night, day] and are blended by daylight.
 * Lantern Harbor's values are the original scene colors, so it looks exactly as before. */

export const THEMES = {
  lantern: {
    skyTop:["#050c17","#3a77b0"], skyBot:["#14293f","#a9d5ea"], warm:"#ff9a62", cloud:["#1a2a3e","#ffffff"],
    far:["#0b1828","#56788f"], near:["#0d1d2e","#46657b"],
    seaTop:["#0f2438","#2f7aa3"], seaBot:["#071321","#1b5274"], wave:["#1d3c5c","#7fc0dd"],
    rock:["#16283b","#56646c"], rock2:["#1d3247","#6d7b82"],
    stripeA:["#a8473b","#d9654f"], stripeB:["#5a2520","#93402f"],
    land:"hills", town:[[22,150],[34,147],[48,152],[66,146],[80,151],[104,156],[118,160],[150,166],[170,170],[196,177]],
    guild:[84,134], guard:[618,146], lookout:[590,176],
  },
  fjord: {
    skyTop:["#030814","#5b86b5"], skyBot:["#0e1f33","#c9dcea"], warm:"#ffb38a", cloud:["#1a2636","#eef3f7"],
    far:["#14222f","#7f95a8"], near:["#0f1c29","#5f788b"], snow:["#7f93a6","#f4f8fb"],
    seaTop:["#0a1c2c","#35607e"], seaBot:["#040d17","#1c3d55"], wave:["#1a3550","#a6c8dc"],
    rock:["#1f2c38","#7f8c96"], rock2:["#a9b8c4","#ffffff"],
    stripeA:["#232a32","#2f363e"], stripeB:["#12171c","#1c2228"],
    land:"peaks", town:[[60,182],[74,184],[98,181],[590,180],[612,178]],
    guild:[70,170], guard:[618,146], lookout:[590,176],
    aurora:true, floes:true, snowfall:true,
  },
  reef: {
    skyTop:["#071224","#2f9be0"], skyBot:["#1c2b4a","#bdeaf2"], warm:"#ff8a6a", cloud:["#24324d","#ffffff"],
    far:["#0d2230","#3e8a6e"], near:["#0e2633","#2f7a5a"],
    seaTop:["#0b2a3a","#2bc2c9"], seaBot:["#061826","#1789a8"], wave:["#1e4a5e","#a8f0ef"],
    rock:["#2b2a26","#e3cf94"], rock2:["#34322b","#f2e2ae"],
    stripeA:["#1f6f7a","#2fa7b5"], stripeB:["#124048","#1e7580"],
    land:"atolls", town:[[96,184],[118,185],[584,185]],
    guild:[96,172], guard:[586,170], lookout:[640,186],
    palms:true, coral:true,
  },
};
