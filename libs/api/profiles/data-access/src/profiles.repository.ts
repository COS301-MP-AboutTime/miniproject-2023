import { IProfile, Post, Status, PrivacyStatus } from '@mp/api/profiles/util';
import { Injectable } from '@nestjs/common';
import { IPasswordSettings } from '@mp/api/profiles/util';
import * as admin from 'firebase-admin';
import { IRelationship } from '../../util/src/interfaces/relationship.interface';
import { Discipline } from '../../util/src/enums/discipline.enum';
import { IUser } from '@mp/api/users/util';
import { IRelation } from '../../util/src/interfaces/relation.interface';

@Injectable()
export class ProfilesRepository {
  async findOne(profile: IProfile) {
    return await admin
      .firestore()
      .collection('profiles')
      .withConverter<IProfile>({
        fromFirestore: (snapshot) => {
          return snapshot.data() as IProfile;
        },
        toFirestore: (it: IProfile) => it,
      })
      .doc(profile.userId)
      .get();
  }

  async createProfile(profile: IProfile) {
    // Remove password field if present
    delete profile.accountDetails?.password;
    return await admin
      .firestore()
      .collection('profiles')
      .doc(profile.userId)
      .create(profile);
  }

  async updateProfile(profile: IProfile) {
    // Remove password field if present
    delete profile.accountDetails?.password;
    return await admin
      .firestore()
      .collection('profiles')
      .doc(profile.userId)
      .set(profile, { merge: true });
  }




  // Pertaining to the settings
  async updatePassword(user : IPasswordSettings) {
    return Status.SUCCESS;
  }


async updatePrivacySettings(user : IProfile) {
  return Status.SUCCESS; 
  }

async getPrivacySettings(user : IProfile) {
  return PrivacyStatus.PUBLIC;
  }

async deleteAccount(profile : IProfile) {
  return Status.SUCCESS; 
}

  async checkRelationship(relationship: IRelationship) {
    return {"exists": true, "type": "FRIEND"}
  }

  async fetchUserPosts(userProfile: IProfile) {
    

    const userID = userProfile.userId;
    const postIDs : string[] = [];
    const postImages = new Map<string, string>();

    const toReturn: { id: string; title: string; author: string; description: string; 
      content: string; time: number; discipline: Discipline; image:string | undefined}[] = [];

    const userPostDocument = await admin.firestore()
    .collection("Posts")
    .where("userId", "==", userID)
    .orderBy("created", "desc")
    .get();
    
    
    
    userPostDocument.forEach((userPost) => {
        const data = userPost.data();
        postIDs.push(data["id"])
      });
  

    const postImageDocument = await admin.firestore()
    .collection("PostPhotos")
    .where("postId", "in", postIDs)
    .get().then((postImageList) =>  {
      postImageList.forEach((postImage) => {
        const data = postImage.data();
        postImages.set(data["postId"], data["image"])
      })
    });

    userPostDocument.forEach((userPost) => {
      const currentDoc = userPost.data();
      const currentDocPostData = currentDoc['postDetails'];
      toReturn.push({
        id: currentDoc['id'],
        title: currentDoc['title'],
        author: userID,  // TODO: Create function to interpret ```currentDoc['author']``` 's userId value and fetch the appropriate user details
        description: currentDocPostData['desc'],
        content: currentDocPostData['content'],
        time: currentDocPostData['timeWatched'],
        discipline: this.interpretDiscipline(currentDocPostData['discipline']),   // TODO - done: Create function to interpret ```currentDocPostData['discipline']``` 's value
        image : postImages.get(currentDoc["id"])
      });
    });

    

    return {
      "postsFound": true, 
      // "list": toReturn.data
      "list": toReturn
    }
  }

  async updateRelation(relation: IRelation) {

    // Change the relation in the db

    // Get succes response from db

    // Return success enum
    return Status.SUCCESS;


  }


  interpretDiscipline(disciplineStr: string) {
    if (disciplineStr.toLowerCase() == "art") {
      return Discipline.ART;
    } else if (disciplineStr.toLowerCase() == "food") {
      return Discipline.FOOD;
    } else if (disciplineStr.toLowerCase() == "gaming") {
      return Discipline.GAMING;
    } else if (disciplineStr.toLowerCase() == "sport") {
      return Discipline.SPORT;
    } else if (disciplineStr.toLowerCase() == "science") {
      return Discipline.SCIENCE;
    } else if (disciplineStr.toLowerCase() == "news") {
      return Discipline.NEWS;
    } else if (disciplineStr.toLowerCase() == "travel") {
      return Discipline.TRAVEL;
    } else {
      return Discipline.MUSIC;
    }

  }
}
