'use strict'

// Use the below to automatically create the list of array.
// Must be run in node, will not work in browser
const fs = require('fs');
const util = require('util')
const multiConditionHandler = require('./multiConditionHandler');


function findFileNames(dirName, svgType) {
  // directory below may need to be modified slightly depending on folder structure
  return svgType === 'option'
    ? fs.readdirSync(`${dirName}`)
        .map(filename => filename.replace(/-01.svg/, '')
      )
        .filter(fn => fn !== '.ds_store')
    : fs.readdirSync(`${dirName}`)
    .map(filename => filename.replace(/_dim-01.svg/, '')
  )
    .filter(fn => fn !== '.ds_store');
}

/* Automatically create custom rule objects */
function createCustomRules(filenameList, floorNum) {
  const multiRules = []

  filenameList.forEach(filename => {
    let count = multiConditionHandler.conditionalCount(filename)

    if (count >= 1) {
      const conditionalIndices = multiConditionHandler.findIndexOfEachConditional(filename)
      const sortedConditionals = multiConditionHandler.sortMultiConditionIntoArrays(conditionalIndices, filename)
      const ruleToAdd = multiConditionHandler.formatMultiCustomRule(sortedConditionals, floorNum, filename)
      multiRules.push(ruleToAdd)
    }
  })
  return multiRules;
}

/* Create non-duplicate list of all possible options */
function sanitizeWhitelist(customRules, initialList) {
  const aggregateOptions = []
  const output = []

  customRules.forEach(rule => {
    // Filter altHref's (conditional filenames from initialList)
    // i.e. 'dvgslstcorn or woodlstcorn or eleclstcorn' would be removed
    initialList = initialList.filter(filename => filename !== rule.altHref)

    // Iterate through each Custom Rule multigroup and push each individual option into aggregateOptions
    Object.keys(rule.multiGroup).forEach(group => {
      rule.multiGroup[group].forEach(opt => aggregateOptions.push(opt))
    })
  })

  // For each option in aggregateOptions, check to see if output array already includes the option
  // --> If it does not, then add option to output array
  // console.log('aggregateOptions', aggregateOptions)
  aggregateOptions.forEach(opt => {
    if (!output.includes(opt)) {
      output.push(opt)
    }
  })

  initialList.forEach(opt => {
    if (!output.includes(opt)) {
      output.push(opt)
    }
  })

  // Return the concatenation of the output list and the modified initialList that has
  // all conditional filenames removed
  return output
}

function findAllSingleOptions(customRules, whitelist) {
  let output = [];

  customRules.forEach(rule => {
    Object.keys(rule.multiGroup).forEach(group => {
      rule.multiGroup[group].forEach(option => {
        if (!output.includes(option)) {
          output.push(option)
        }
      })
    })
  })

  return whitelist.filter(opt => !output.includes(opt));
}

function callWithThreeFloors(directory, floorArray) {
  let floor_1 = findFileNames(`../${directory}/${floorArray[0]}`, 'option');
  let floor_2 = findFileNames(`../${directory}/${floorArray[1]}`, 'option');
  let floor_3 = findFileNames(`../${directory}/${floorArray[2]}`, 'option');


  const floorOneDimensions = findFileNames(`../${directory}/${dimsArray[0]}`, 'dimension');
  const floorTwoDimensions = findFileNames(`../${directory}/${dimsArray[1]}`, 'dimension');
  const floorThreeDimensions = findFileNames(`../${directory}/${dimsArray[2]}`, 'dimension');

  const customRulesFloorOne = createCustomRules(floor_1, 1);
  const customRulesFloorTwo = createCustomRules(floor_2, 2);
  const customRulesFloorThree = createCustomRules(floor_3, 3);

  const whitelistOutputFloorOne = sanitizeWhitelist(customRulesFloorOne, floor_1);
  const whitelistOutputFloorTwo = sanitizeWhitelist(customRulesFloorTwo, floor_2);
  const whitelistOutputFloorThree = sanitizeWhitelist(customRulesFloorThree, floor_3);

  console.log('\noptionsWhitelist: {');
  console.log('\tfirst:', whitelistOutputFloorOne, ',');
  console.log('\tsecond:', whitelistOutputFloorTwo, ',');
  console.log('\tthird:', whitelistOutputFloorThree);
  console.log('},');
  console.log('\nDimension Whitelists:');
  console.log('\tfirst:', floorOneDimensions, ',');
  console.log('\tsecond:', floorTwoDimensions, ',');
  console.log('\tthird:', floorThreeDimensions);
  console.log('},');
  console.log('all Custom Rules:', util.inspect(customRulesFloorOne.concat(customRulesFloorTwo).concat(customRulesFloorThree), { showHidden: false, depth: null }));
};

function callWithTwoFloors(directory, floorArray, dimsArray) {
  const floor_1 = findFileNames(`../${directory}/${floorArray[0]}`, 'option');
  const floor_2 = findFileNames(`../${directory}/${floorArray[1]}`, 'option');

  const floorOneDimensions = findFileNames(`../${directory}/${dimsArray[0]}`, 'dimension');
  const floorTwoDimensions = findFileNames(`../${directory}/${dimsArray[1]}`, 'dimension');

  const customRulesFloorOne = createCustomRules(floor_1, 'first');
  const customRulesFloorTwo = createCustomRules(floor_2, 'second');

  const whitelistOutputFloorOne = sanitizeWhitelist(customRulesFloorOne, floor_1);
  const whitelistOutputFloorTwo = sanitizeWhitelist(customRulesFloorTwo, floor_2);

  console.log('\noptionsWhitelist: {');
  console.log('\tfirst:', whitelistOutputFloorOne, ',');
  console.log('\tsecond:', whitelistOutputFloorTwo);
  console.log('},');
  console.log('dimensionsWhitelist: {');
  console.log('\tfirst:', floorOneDimensions, ',');
  console.log('\tsecond:', floorTwoDimensions);
  console.log('},');
  console.log('customRules:', util.inspect(customRulesFloorOne.concat(customRulesFloorTwo), { showHidden: false, depth: null }), ',');
}


function callWithOneFloors(directory, floorArray, dimsArray) {
  const floor_1 = findFileNames(`../${directory}/${floorArray[0]}`, 'option');
  const floorOneDimensions = findFileNames(`../${directory}/${dimsArray[0]}`, 'dimension');
  const customRulesFloorOne = createCustomRules(floor_1, 1);
  const whitelistOutputFloorOne = sanitizeWhitelist(customRulesFloorOne, floor_1);

  console.log('\nWhitelists:');
  console.log('\nfirst:', whitelistOutputFloorOne)

  console.log('\nDimension Whitelists:');
  console.log('\nfirst:', floorOneDimensions);

  console.log('\n\nall Custom Rules:', util.inspect(customRulesFloorOne, { showHidden: false, depth: null }));
}

//////////////////////////////////////////////////////////////////////
//                                                                  //
// FOR NOW - NEED TO MANUALLY ADJUST BELOW BASED ON MODEL SPECIFICS //
//                                                                  //
//////////////////////////////////////////////////////////////////////

// SIGNATURE DIRECTORIES
const modelName = 'Dallas';
const numFloors = 2;
const directory = `Signature/${modelName}/`

const oneFloorArray = ['First/opts']
const twoFloorArray = ['First/opts', 'Second/opts']
const threeFloorArray = ['First/opts', 'Second/opts', 'Third/opts']

const oneFloorDimsArray = ['First/dimensions']
const twoFloorDimsArray = ['First/dimensions', 'Second/dimensions']
const threeFloorDimsArray = ['First/dimensions', 'Second/dimensions', 'Third/dimensions']


switch(numFloors){
  case 1:
    callWithOneFloors(directory, oneFloorArray, oneFloorDimsArray)
    break;
  case 2:
    callWithTwoFloors(directory, twoFloorArray, twoFloorDimsArray)
    break;
  case 1:
    callWithOneFloors(directory, threeFloorArray, threeFloorDimsArray)
    break;
}


// callWithTwoFloors(directory, twoFloorArray, twoFloorDimsArray)
// callWithThreeFloors(directory, threeFloorArray)


// ARBOR HOME DIRECTORIES

// const directory = 'Arbor/Phase_2/199_872'
// const directory = 'Arbor/Bradford(868)/199_868'
// const directory = 'Arbor/Chestnut(869)/199_869'
// const directory = 'Arbor/199_864-Cottonwood'
// const directory = 'Arbor/199_872-Aspen/199_872'
// const directory = 'Arbor/Phase_2/218/218/870/svg/std'

// const oneFloorArray = ['floor_1']
// const twoFloorArray = ['floor_1', 'floor_2']
// const threeFloorArray = ['floor_1', 'floor_2', 'floor_3']


// callWithOneFloors(directory, oneFloorArray)
// callWithTwoFloors(directory, twoFloorArray)
// callWithThreeFloors(directory, threeFloorArray)