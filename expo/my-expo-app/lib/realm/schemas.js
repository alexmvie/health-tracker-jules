import Realm from 'realm';

// Commenting out the TestObject schema as requested
// export class TestObject extends Realm.Object {
//   static schema = {
//     name: 'TestObject',
//     properties: {
//       _id: { type: 'objectId', default: () => new Realm.BSON.ObjectId() },
//       name: 'string',
//     },
//     primaryKey: '_id',
//   };
// }

export class Profile extends Realm.Object {
  static schema = {
    name: 'Profile',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new Realm.BSON.ObjectId() },
      name: 'string', // Required string
      createdAt: { type: 'date', default: () => new Date() },
    },
  };
}

export class HealthEntry extends Realm.Object {
  static schema = {
    name: 'HealthEntry',
    primaryKey: '_id',
    properties: {
      _id: { type: 'objectId', default: () => new Realm.BSON.ObjectId() },
      profileId: 'objectId', // Foreign key to Profile._id
      date: { type: 'date', default: () => new Date() },
      systolic: 'int?', 
      diastolic: 'int?',
      pulse: 'int?',
      spO2: 'int?', 
      weight: 'float?',
      medications: 'string?',
      notes: 'string?',
      createdAt: { type: 'date', default: () => new Date() },
    },
  };
}

// To use these schemas, you would typically pass them in an array to the Realm constructor:
// const realm = new Realm({ schema: [Profile, HealthEntry] });
// Or, if you have an array like this:
// export const allSchemas = [Profile, HealthEntry];
// const realm = new Realm({ schema: allSchemas });
