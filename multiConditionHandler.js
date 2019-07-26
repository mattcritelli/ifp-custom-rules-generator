const util = require('util')

// Determine number of conditionals in filename
function conditionalCount(filename) {
  const conditionals = [' or ', ' and not ', ' and ', ' join ']
  let count = 0;

  conditionals.forEach(condition => {
    if (filename.includes(condition)) {
      count++;
      while (filename.includes(condition)) {
        const idx = filename.indexOf(condition);
        const beginning = filename.slice(0, idx);
        const end = filename.slice((idx + condition.length));
        filename = beginning + " " + end;
      }
    };
  });
  return count;
};

/*
  Find index positions for all conditionals

  Example output for: dvgslstcorn or woodlstcorn or eleclstcorn and stru-2ftrear and not stru-2ftsidegargopp

  { firstConditional: { ruleType: ' or ', index: 11 },
    conditionals:
     { ' or ': [ 11, 26 ],
       ' and not ': [ 58 ],
       ' and ': [ 41 ],
       ' join ': []
     }
   }

 */
function findIndexOfEachConditional(filename) {
  const conditionalsList = [' or ', ' and not ', ' and ', ' join ']
  let earliestConditionalIdx = null;
  let output = {
    firstConditional: null,
    conditionals: { ' or ': [], ' and not ': [], ' and ': [], ' join ': [] }
  }

  // Iterate through entire filename string
  for (var fileIdx = 0, fileLength = filename.length; fileIdx < fileLength; fileIdx++) {
    // For each string position - check to see if it is the start of a conditional
    for (var checkCondition = 0; checkCondition < conditionalsList.length; checkCondition++) {
      // Grabs part of string starting with current index and adding to it the length of conditional to check
      let stringToMatch = filename.slice(fileIdx, fileIdx + conditionalsList[checkCondition].length)
      if (stringToMatch === conditionalsList[checkCondition]) {
        output.conditionals[conditionalsList[checkCondition]].push(fileIdx)
      }
    }
  }

  // Filter out false positives that occur when both 'and' & 'and not' match - if duplicates remove index from 'and' array
  output.conditionals[' and '] = output.conditionals[' and '].filter(index => !output.conditionals[' and not '].includes(index))

  // Adds to output object the first conditional index found and the type
  for (cond in output.conditionals) {
    output.conditionals[cond].forEach(index => {
      if (!earliestConditionalIdx || index < earliestConditionalIdx) {
        earliestConditionalIdx = index;
        output.firstConditional = { ruleType: cond, index: index }
      }
    })
  }
  return output
};

/*
  Example output for: dvgslstcorn or woodlstcorn or eleclstcorn and stru-2ftrear and not stru-2ftsidegargopp

  { conditionalToReplace: ' or ',
    conditionalLists:
     { ' or ': [ 'dvgslstcorn', 'woodlstcorn', 'eleclstcorn' ],
       ' and ': [ 'stru-2ftrear' ],
       ' and not ': [ 'stru-2ftsidegargopp' ],
       ' join ': []
     }
   }
 */
function sortMultiConditionIntoArrays(objectWithConditionalIndices, filename) {
  // Store array of all spaces within a filename which will be used to find end of options
  const spaceIndexes = [];
  filename.split('').map((char, i) => {
    if (char === ' ') {
      spaceIndexes.push(i)
    }
  })

  // Create object to store options by condition type
  sortedConditionalHrefs = {
    conditionalToReplace: objectWithConditionalIndices.firstConditional.ruleType,
    conditionalLists: {
      ' or ': [],
      ' and ': [],
      ' and not ': [],
      ' join ': []
    }
  }

  // Handle first conditional
  const firstCondIndex = objectWithConditionalIndices.firstConditional.index
  sortedConditionalHrefs.conditionalLists[objectWithConditionalIndices.firstConditional.ruleType].push(filename.slice(0, firstCondIndex))

  // handle remaining
  for (conditional in objectWithConditionalIndices.conditionals) {
    objectWithConditionalIndices.conditionals[conditional].map(index => {
      const endSlice = spaceIndexes.find(spaceIdx => spaceIdx > (index + conditional.length))
      const startSlice = index + conditional.length
      const slicedOption = filename.slice(startSlice, endSlice)
      sortedConditionalHrefs.conditionalLists[conditional].push(slicedOption)

    })
  }
  // console.log('\nsortedConditionalHrefs in sortMultiConditionIntoArrays', sortedConditionalHrefs)
  return sortedConditionalHrefs
}

/*
Example output for: dvgslstcorn or woodlstcorn or eleclstcorn and stru-2ftrear and not stru-2ftsidegargopp

    { altHref: 'dvgslstcorn or woodlstcorn or eleclstcorn and stru-2ftrear and not stru-2ftsidegargopp',
      floor: 1,
      ruleType: 'multi',
      groupToReplace: 'multiOr',
      multiGroup:
       { multiOr: [ 'dvgslstcorn', 'woodlstcorn', 'eleclstcorn' ],
         multiAnd: [ 'stru-2ftrear' ],
         multiAndNot: [ 'stru-2ftsidegargopp' ]
       }
     }
 */
function formatMultiCustomRule(result, floorNum, originalFilename) {
  const categoryList = ['fdtn-foundation', 'stru-bnrm-layout']
  const output = {
    altHref: originalFilename,
    floor: floorNum,
    ruleType: 'multi',
    groupToReplace: null,
    multiGroup: {},
    layerPriority: null
  }
  const conditionalDict = {
    ' or ': 'multiOr',
    ' and ': 'multiAnd',
    ' and not ': 'multiAndNot',
    ' join ': 'multiJoin'
  }

  for (condType in result.conditionalLists) {
    if (result.conditionalLists[condType].length > 0) {
      output.multiGroup[conditionalDict[condType]] = result.conditionalLists[condType]

      if (result.conditionalLists[condType].some(opt => categoryList.includes(opt))) {
        output.ruleType = 'multiCategory'
      }

      if (condType === result.conditionalToReplace) {
        output.groupToReplace = conditionalDict[condType]
      }
      // output.multiGroup.push({[conditionalDict[condType]] = result.conditionalLists[condType]})
    }
  }
  output.layerPriority = 3
  // console.log('\noutput at end of formatMultiCustomRule:\n', util.inspect(output, {showHidden: false, depth: null} ))
  return output
}


module.exports = {
  conditionalCount: conditionalCount,
  findIndexOfEachConditional: findIndexOfEachConditional,
  sortMultiConditionIntoArrays: sortMultiConditionIntoArrays,
  formatMultiCustomRule: formatMultiCustomRule
}
