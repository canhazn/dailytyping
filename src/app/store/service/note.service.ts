import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { firestore } from 'firebase/app';

import { AuthService } from '@store/service/auth.service';

import { User }  from '@store/model/auth.model';
import { Note } from '@store/model/note.model';

import { Observable, of, from } from 'rxjs';
import { take, map, tap, switchMap, catchError, filter, shareReplay, skipWhile, takeWhile } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  /**
   * Get today note
   * Create/Delete/Update note
   * Get note by noteId
   * 
   * 
  */

  todayNote: Observable<Note[]>;

  constructor(private afs: AngularFirestore, private authService: AuthService ) {
    this.todayNote = this.getTodayNote().pipe(shareReplay(1));
  }

  private getUser(): Observable<User> {
    return this.authService.user.pipe(take(1))
  }

  private getTodayNote(): Observable<Note[]> {
    let today = new Date();
    let startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // let endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return this.getUser().pipe(
      map(user => `/user/${user.uid}/note`),
      switchMap(path => this.afs.collection(path, ref => ref.where("createdAt", ">=", startTime).orderBy("createdAt",  "desc")).snapshotChanges()),
      map(actions => this.reduceData(actions)),
      tap(arrayNote => arrayNote.length == 0 ? this.createNote().subscribe() : "nothing")
    )
  }

  getNoteById(noteId: string): Observable<Note> {
    return this.getUser().pipe(
      map(user => `/user/${user.uid}/note/${noteId}`),
      map(path => this.afs.doc<Note>(path)),
      switchMap(note => note.valueChanges()),
    )
  }

  // set a new Note and return ....
  createNote(): Observable<Note> {      
    let note: Note = {
      noteId: this.afs.createId(),
      createdAt: firestore.Timestamp.now(),
      edittedAt: firestore.Timestamp.now(),
      content: '',
      like: 0
    };

    return this.getUser().pipe(
      map(user => this.afs.collection(`/user/${user.uid}/note`)),
      switchMap(path => from (path.doc(note.noteId).set(note)) ),
      map( success => note),
      catchError(err => of(err))
    )
  }

  // update Note return Observable
  updateNote(note: Note): Observable<any> {    
    return this.getUser().pipe(            
      // tap(_ => console.log(note)),
      map(user => this.afs.doc<any>(`user/${user.uid}/note/${note.noteId}`)),
      tap(() => delete note.noteId ),
      switchMap(path => from (path.update(note)) ),
    )
  }

  // Delete note
  deleteNote(note: Note): Observable<any>{
    return this.getUser().pipe(               
      map(user => `user/${user.uid}/note/${note.noteId}`),         
      map(path => this.afs.doc<any>(path)),      
      switchMap(path => from (path.delete()) ),
    )
  }
  
  getYesterdayNote() {
    let today = new Date();       
    let startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);    
    let endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());    
    return this.getUser().pipe(      
      map(user => `/user/${user.uid}/note`),
      map(path => this.afs.collection(path, ref => ref.where("createdAt", ">=", startTime).where("createdAt", "<=", endTime))),
      switchMap(noteCollection => noteCollection.snapshotChanges().pipe(        
        map(actions => actions.map(a => {
            const data = a.payload.doc.data() as Note;
            console.log(a.payload.doc.metadata.fromCache, data)
            return data;
        })),
      )),      
    )
  }

  private reduceData(actions: DocumentChangeAction<{}>[]): Note[] {
    return actions.map(a => {
        const data = a.payload.doc.data() as Note;        
        return data;
    })
  }

  getThisWeek() {
    let today =  new Date();
    let day = today.getDay();
    let monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (day == 0?-6:1)-day );
    let sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (day == 0?0:7)-day + 1);

    return this.getUser().pipe(      
      map(user => `user/${user.uid}/note`),
      map(path => this.afs.collection(path, ref => {
        let query : firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
        return query.where("createdAt", ">=", monday).where("createdAt", "<=", sunday).orderBy("createdAt");
      })),
      switchMap(collectionNote => collectionNote.snapshotChanges().pipe(        
        map(actions => actions.map(a => {
            const data = a.payload.doc.data() as Note;
            // console.log(a.payload.doc.metadata.fromCache, 'noteId: ' + a.payload.doc.id)
            return data;
        })),        
      )),
    )
  } 

  getThisMonth() {

    let today =  new Date();
    
    let startTime = new Date(today.getFullYear(), today.getMonth(), 1)
    let endTime = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    return this.getUser().pipe(      
      map(user => `user/${user.uid}/note`),
      map(path => this.afs.collection(path, ref => {
        let query : firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
        return query.where("createdAt", ">=", startTime).where("createdAt", "<=", endTime).orderBy("createdAt");
      })),
      switchMap(collectionNote => collectionNote.snapshotChanges().pipe(        
        map(actions => actions.map(a => {
            const data = a.payload.doc.data() as Note;
            // console.log(a.payload.doc.metadata.fromCache, data)
            return data;
        })),        
      )),
    )
  } 

  fetchThisWeek() {

    let today =  new Date();
    let day = today.getDay();
    let monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (day == 0?-6:1)-day );
    let sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (day == 0?0:7)-day + 1);

    return this.getUser().pipe(      
      map(user => `user/${user.uid}/note`),
      map(path => this.afs.collection(path, ref => {
        let query : firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
        return query.where("createdAt", ">=", monday).where("createdAt", "<=", sunday).orderBy("createdAt");
      })),
      switchMap(collection => collection.stateChanges()),
    )
  } 

  getRandomLikedNote() {
    let like = Math.floor(Math.random() * 5) + 1;
    return this.getUser().pipe(      
      map(user => `/user/${user.uid}/note`),
      map(path => this.afs.collection(path, ref => ref.where("like", ">=", like).limit(1))),
      switchMap(noteCollection => noteCollection.valueChanges().pipe(map(([note]) => note))),
    )
  }
}
