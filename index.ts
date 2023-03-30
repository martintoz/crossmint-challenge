const { default: axios } = require("axios")
require('dotenv').config()

enum AstralObject {
    SPACE = 'SPACE',
    POLYANET = 'POLYANET',
    COMETH = 'COMETH',
    SOLOON = 'SOLOON',
}

enum ComethDirection {
    RIGHT = 'right',
    LEFT = 'left',
    UP = 'up',
    DOWN = 'down',
}

enum SoloonColor {
    BLUE = 'blue',
    RED = 'red',
    WHITE = 'white',
    PURPLE = 'purple'
}

interface goalMap {
    goal: AstralObject[][];
}
interface cell {
    row: number, 
    column: number
}

interface soloonCell extends cell {
    color: SoloonColor | string
}

interface comethCell extends cell {
    direction: ComethDirection | string
}

interface cellGroup {
    polyanets: cell[],
    soloons: soloonCell[],
    comeths: comethCell[],
}

interface postObject extends Partial<soloonCell>, Partial<comethCell> {
    candidateId?: string
}


const fetchGoalMap = async (): Promise<goalMap> => {
    try {
        const fetchGoalUrl: string = `${process.env.BASE_API_URL}map/${process.env.CANDIDATE_ID}/goal`
        const goalRes = await axios.get(fetchGoalUrl);
        const goalMap: goalMap = goalRes.data
        return goalMap
    }
    catch (err: any) {
        console.log('ERROR:', err.message)
        return {goal: []}
    }

}

const setAstralObjects = async (cell: postObject, astralObjectType: AstralObject): Promise<void> => {
  const astralObjectUrl: string = `${process.env.BASE_API_URL}${astralObjectType.toLowerCase()}s`;
  let postObject: postObject = { row: cell.row, column: cell.column, candidateId: process.env.CANDIDATE_ID }
  if(astralObjectType.includes(AstralObject.COMETH)){
    postObject.direction = cell.direction
  }
  if(astralObjectType.includes(AstralObject.SOLOON)){
    postObject.color = cell.color
  }
  await axios
    .post(astralObjectUrl, postObject)
    .then((res: any) => {
      console.log("Posted: ", postObject);
    })
    .catch((err: any) => {
      console.log("Error: ", err);
    });
};

const setRow = (goalRow: AstralObject[], rowNum: number): cellGroup => {
  let polyanets: cell[] = [];
  let soloons: soloonCell[] = [];
  let comeths: comethCell[] = [];

  goalRow.forEach((astralObject, i) => {
    if (astralObject === AstralObject.POLYANET) {
      polyanets.push({ row: rowNum, column: i });
    }
    else if (astralObject.includes(AstralObject.COMETH)){
        let cometh: comethCell = {
            row: rowNum,
            column: i,
            direction: astralObject.split("_")[0].toLowerCase()
        };
        comeths.push(cometh)
    }
    else if (astralObject.includes(AstralObject.SOLOON)){
        let soloon: soloonCell = {
            row: rowNum,
            column: i,
            color: astralObject.split("_")[0].toLowerCase()
        };
        soloons.push(soloon)
    }
  });
  const cellGroup: cellGroup = {
    polyanets,
    soloons,
    comeths
  }
  return cellGroup;
};

const setGoalMap = (goalMap: goalMap) => {
    let polyanets: cell[] = [] 
    let soloons: soloonCell[] = [] 
    let comeths: comethCell[] = []
    goalMap.goal.forEach((goalRow, i) => {
        const cellGroup = setRow(goalRow, i)
        polyanets.push(...cellGroup.polyanets);
        soloons.push(...cellGroup.soloons);
        comeths.push(...cellGroup.comeths);
    })
    polyanets.forEach((polyanet, i) => {
        setTimeout(() => {
            setAstralObjects(polyanet, AstralObject.POLYANET)
        }, i * 1000)
    }) 
    soloons.forEach((soloon, i) => {
        setTimeout(() => {
            setAstralObjects(soloon, AstralObject.SOLOON)
        }, (i + polyanets.length) * 1300)
    }) 
    comeths.forEach((cometh, i) => {
        setTimeout(() => {
            setAstralObjects(cometh, AstralObject.COMETH)
        }, (i + polyanets.length + soloons.length) * 1500)
    }) 
}

const fetchAndSetGoalMap = async () => {
    const goalMap: goalMap = await fetchGoalMap();
    goalMap.goal.length && setGoalMap(goalMap)
}

fetchAndSetGoalMap()