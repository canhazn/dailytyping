import { Note } from '@store/model/note.model';

export interface ThisWeekStateModel {
	initialized: boolean,
	entity?: Note[]
}

export interface ReviewStateModel {
	yesterday?: {
		initialized: boolean,
		entity: Note
	}

	thisWeek: {
		initialized?: boolean,
		entity?: any,
	}

	thisMonth?: {
		initialized: boolean,
		entity: Note[]
	}
}