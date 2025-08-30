//https://demo-aus.sharedo.tech/api/modeller/sharedoTypes/instruction-b2c-enquiry-dispute-claimant/participantRoles/athlete/permissions


type Permissions = {
  systemName: string;
  grant: Grant;
  byPhase: ByPhase[];
};

type ByPhase  = {
  systemName: string;
  grant: Grant;
};

enum Grant {    
    none = "None",
    user="User",
    userOrTeam="UserOrTeam",
    byPhase="ByPhase"
}

// [
//     {
//       "systemName": "core.sharedo.attachment.add",
//       "grant": "None",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.sharedo.attachment.remove",
//       "grant": "None",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.sharedo.attachment.upload",
//       "grant": "None",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.sharedo.audit",
//       "grant": "None",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.sharedo.delete",
//       "grant": "None",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.sharedo.participant.assign",
//       "grant": "User",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.sharedo.participant.read",
//       "grant": "ByPhase",
//       "byPhase": [
//         {
//           "systemName": "instruction-b2c-abandoned",
//           "grant": "UserOrTeam"
//         },
//         {
//           "systemName": "instruction-b2c-chase-up",
//           "grant": "UserOrTeam"
//         },
//         {
//           "systemName": "instruction-b2c-converted",
//           "grant": "User"
//         }
//       ]
//     },
//     {
//       "systemName": "core.sharedo.progress.milestone",
//       "grant": "None",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.read",
//       "grant": "None",
//       "byPhase": []
//     },
//     {
//       "systemName": "core.sharedo.update",
//       "grant": "None",
//       "byPhase": []
//     }
//   ]