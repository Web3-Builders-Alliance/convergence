export type Convergence = {
  version: "0.1.0";
  name: "convergence";
  instructions: [
    {
      name: "registerUser";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "createPoll";
      accounts: [
        {
          name: "creator";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "question";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
        {
          name: "endTime";
          type: {
            option: "u64";
          };
        }
      ];
    },
    {
      name: "startPoll";
      accounts: [
        {
          name: "creator";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "makePrediction";
      accounts: [
        {
          name: "forecaster";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: false;
          isSigner: false;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userPrediction";
          isMut: true;
          isSigner: false;
        },
        {
          name: "predictionUpdate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "lowerPrediction";
          type: "u16";
        },
        {
          name: "upperPrediction";
          type: "u16";
        }
      ];
    },
    {
      name: "updatePrediction";
      accounts: [
        {
          name: "forecaster";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userPrediction";
          isMut: true;
          isSigner: false;
        },
        {
          name: "predictionUpdate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "newLowerPrediction";
          type: "u16";
        },
        {
          name: "newUpperPrediction";
          type: "u16";
        }
      ];
    },
    {
      name: "removePrediction";
      accounts: [
        {
          name: "forecaster";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userPrediction";
          isMut: true;
          isSigner: false;
        },
        {
          name: "predictionUpdate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "resolvePoll";
      accounts: [
        {
          name: "resolver";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "result";
          type: "bool";
        }
      ];
    },
    {
      name: "collectPoints";
      accounts: [
        {
          name: "forecaster";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userPrediction";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "Poll";
      type: {
        kind: "struct";
        fields: [
          {
            name: "creator";
            type: "publicKey";
          },
          {
            name: "resolver";
            type: "publicKey";
          },
          {
            name: "open";
            type: "bool";
          },
          {
            name: "question";
            type: "string";
          },
          {
            name: "description";
            type: "string";
          },
          {
            name: "startSlot";
            type: "u64";
          },
          {
            name: "endSlot";
            type: "u64";
          },
          {
            name: "endTime";
            type: {
              option: "u64";
            };
          },
          {
            name: "crowdPrediction";
            type: {
              option: "u32";
            };
          },
          {
            name: "numForecasters";
            type: "u64";
          },
          {
            name: "numPredictionUpdates";
            type: "u64";
          },
          {
            name: "accumulatedWeights";
            type: "f32";
          },
          {
            name: "result";
            type: {
              option: "bool";
            };
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "PredictionUpdate";
      type: {
        kind: "struct";
        fields: [
          {
            name: "prediction";
            type: {
              option: "u32";
            };
          },
          {
            name: "slot";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "ScoringList";
      type: {
        kind: "struct";
        fields: [
          {
            name: "options";
            type: {
              vec: "i64";
            };
          },
          {
            name: "cost";
            type: {
              vec: "f32";
            };
          },
          {
            name: "lastSlot";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "UserPrediction";
      type: {
        kind: "struct";
        fields: [
          {
            name: "lowerPrediction";
            type: "u16";
          },
          {
            name: "upperPrediction";
            type: "u16";
          },
          {
            name: "weight";
            type: "f32";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "UserScore";
      type: {
        kind: "struct";
        fields: [
          {
            name: "options";
            type: "i64";
          },
          {
            name: "lastLowerOption";
            type: "i64";
          },
          {
            name: "lastUpperOption";
            type: "i64";
          },
          {
            name: "cost";
            type: "f32";
          },
          {
            name: "lastLowerCost";
            type: "f32";
          },
          {
            name: "lastUpperCost";
            type: "f32";
          },
          {
            name: "lnA";
            type: "f32";
          },
          {
            name: "lnB";
            type: "f32";
          },
          {
            name: "lastSlot";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "User";
      type: {
        kind: "struct";
        fields: [
          {
            name: "score";
            type: "f32";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "PollClosed";
      msg: "Poll is closed.";
    },
    {
      code: 6001;
      name: "PollNotResolved";
      msg: "Poll has not been resolved.";
    }
  ];
  metadata: {
    address: "4irSQbid9JUAkhUf5yhnx5o3EgaY3saAErK9oQtPURHo";
  };
};

export const IDL: Convergence = {
  version: "0.1.0",
  name: "convergence",
  instructions: [
    {
      name: "registerUser",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "user",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "createPoll",
      accounts: [
        {
          name: "creator",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "question",
          type: "string",
        },
        {
          name: "description",
          type: "string",
        },
        {
          name: "endTime",
          type: {
            option: "u64",
          },
        },
      ],
    },
    {
      name: "startPoll",
      accounts: [
        {
          name: "creator",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "makePrediction",
      accounts: [
        {
          name: "forecaster",
          isMut: true,
          isSigner: true,
        },
        {
          name: "user",
          isMut: false,
          isSigner: false,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userPrediction",
          isMut: true,
          isSigner: false,
        },
        {
          name: "predictionUpdate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "lowerPrediction",
          type: "u16",
        },
        {
          name: "upperPrediction",
          type: "u16",
        },
      ],
    },
    {
      name: "updatePrediction",
      accounts: [
        {
          name: "forecaster",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userPrediction",
          isMut: true,
          isSigner: false,
        },
        {
          name: "predictionUpdate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "newLowerPrediction",
          type: "u16",
        },
        {
          name: "newUpperPrediction",
          type: "u16",
        },
      ],
    },
    {
      name: "removePrediction",
      accounts: [
        {
          name: "forecaster",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userPrediction",
          isMut: true,
          isSigner: false,
        },
        {
          name: "predictionUpdate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "resolvePoll",
      accounts: [
        {
          name: "resolver",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "result",
          type: "bool",
        },
      ],
    },
    {
      name: "collectPoints",
      accounts: [
        {
          name: "forecaster",
          isMut: true,
          isSigner: true,
        },
        {
          name: "user",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userPrediction",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Poll",
      type: {
        kind: "struct",
        fields: [
          {
            name: "creator",
            type: "publicKey",
          },
          {
            name: "resolver",
            type: "publicKey",
          },
          {
            name: "open",
            type: "bool",
          },
          {
            name: "question",
            type: "string",
          },
          {
            name: "description",
            type: "string",
          },
          {
            name: "startSlot",
            type: "u64",
          },
          {
            name: "endSlot",
            type: "u64",
          },
          {
            name: "endTime",
            type: {
              option: "u64",
            },
          },
          {
            name: "crowdPrediction",
            type: {
              option: "u32",
            },
          },
          {
            name: "numForecasters",
            type: "u64",
          },
          {
            name: "numPredictionUpdates",
            type: "u64",
          },
          {
            name: "accumulatedWeights",
            type: "f32",
          },
          {
            name: "result",
            type: {
              option: "bool",
            },
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "PredictionUpdate",
      type: {
        kind: "struct",
        fields: [
          {
            name: "prediction",
            type: {
              option: "u32",
            },
          },
          {
            name: "slot",
            type: "u64",
          },
          {
            name: "timestamp",
            type: "i64",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "ScoringList",
      type: {
        kind: "struct",
        fields: [
          {
            name: "options",
            type: {
              vec: "i64",
            },
          },
          {
            name: "cost",
            type: {
              vec: "f32",
            },
          },
          {
            name: "lastSlot",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "UserPrediction",
      type: {
        kind: "struct",
        fields: [
          {
            name: "lowerPrediction",
            type: "u16",
          },
          {
            name: "upperPrediction",
            type: "u16",
          },
          {
            name: "weight",
            type: "f32",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "UserScore",
      type: {
        kind: "struct",
        fields: [
          {
            name: "options",
            type: "i64",
          },
          {
            name: "lastLowerOption",
            type: "i64",
          },
          {
            name: "lastUpperOption",
            type: "i64",
          },
          {
            name: "cost",
            type: "f32",
          },
          {
            name: "lastLowerCost",
            type: "f32",
          },
          {
            name: "lastUpperCost",
            type: "f32",
          },
          {
            name: "lnA",
            type: "f32",
          },
          {
            name: "lnB",
            type: "f32",
          },
          {
            name: "lastSlot",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "User",
      type: {
        kind: "struct",
        fields: [
          {
            name: "score",
            type: "f32",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "PollClosed",
      msg: "Poll is closed.",
    },
    {
      code: 6001,
      name: "PollNotResolved",
      msg: "Poll has not been resolved.",
    },
  ],
  metadata: {
    address: "4irSQbid9JUAkhUf5yhnx5o3EgaY3saAErK9oQtPURHo",
  },
};
